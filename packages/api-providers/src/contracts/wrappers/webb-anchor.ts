// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable camelcase */

import { Log } from '@ethersproject/abstract-provider';
import { anchorDeploymentBlock, bridgeCurrencyBridgeStorageFactory, MixerStorage } from '@webb-tools/api-providers/utils/index.js';
import { retryPromise } from '@webb-tools/api-providers/utils/retry-promise.js';
import { LoggerService } from '@webb-tools/app-util/index.js';
import { ERC20, ERC20__factory as ERC20Factory, FixedDepositAnchor, FixedDepositAnchor__factory } from '@webb-tools/contracts';
import { getFixedAnchorExtDataHash } from '@webb-tools/utils';
import { BigNumber, Contract, providers, Signer } from 'ethers';
import utils from 'web3-utils';

import { EvmChainMixersInfo } from '../../web3/EvmChainMixersInfo.js';
import { bufferToFixed, createAnchor2Deposit, createRootsBytes, Deposit, EvmNote, generateWithdrawProofCallData } from '../utils/index.js';
import { MerkleTree, PoseidonHasher } from '../utils/merkle/index.js';
import { AnchorWitnessInput, ZKPWebbAnchorInputWithMerkle, ZKPWebbAnchorInputWithoutMerkle } from './types.js';
import { generateWitness, proofAndVerify, zeroAddress } from './webb-utils.js';

type DepositEvent = [string, number, BigNumber];
const logger = LoggerService.get('AnchorContract');

export interface IPublicInputs {
  _roots: string;
  _nullifierHash: string;
  _refreshCommitment: string;
  _recipient: string;
  _relayer: string;
  _fee: string;
  _refund: string;
}

export class AnchorContract {
  private _contract: FixedDepositAnchor;
  private readonly signer: Signer;

  constructor (
    public mixersInfo: EvmChainMixersInfo,
    private web3Provider: providers.Web3Provider,
    address: string,
    useProvider = false
  ) {
    this.signer = this.web3Provider.getSigner();
    logger.info(`Init with address ${address} `);
    this._contract = new Contract(
      address,
      FixedDepositAnchor__factory.abi,
      useProvider ? this.web3Provider : this.signer
    ) as any;
  }

  get getLastRoot () {
    return this._contract.getLastRoot();
  }

  get nextIndex () {
    return this._contract.nextIndex();
  }

  get denomination () {
    return this._contract.denomination();
  }

  get inner () {
    return this._contract;
  }

  async createDeposit (assetSymbol: string, chainId: number): Promise<{ note: EvmNote; deposit: Deposit }> {
    const deposit = createAnchor2Deposit(chainId);
    const depositSizeBN = await this.denomination;
    const depositSize = Number.parseFloat(utils.fromWei(depositSizeBN.toString(), 'ether'));
    const note = new EvmNote(assetSymbol, depositSize, chainId, deposit.preimage);

    return {
      deposit,
      note
    };
  }

  static createTreeWithRoot (leaves: string[], targetRoot: string): MerkleTree | undefined {
    const tree = MerkleTree.new('eth', 30, [], new PoseidonHasher());

    for (let i = 0; i < leaves.length; i++) {
      tree.insert(leaves[i]);
      console.log('createTreeWithRoot - leaf: ', leaves[i]);
      const nextRoot = tree.getRoot();

      logger.log(`target root: ${targetRoot} \n this root: ${bufferToFixed(nextRoot)}`);

      if (bufferToFixed(nextRoot) === targetRoot) {
        return tree;
      }
    }

    return undefined;
  }

  async getWebbToken (): Promise<ERC20> {
    const tokenAddress = await this._contract.token();
    const tokenInstance = ERC20Factory.connect(tokenAddress, this.signer);

    return tokenInstance;
  }

  async isWebbTokenApprovalRequired (onComplete?: (event: DepositEvent) => void) {
    const userAddress = await this.signer.getAddress();
    const tokenInstance = await this.getWebbToken();
    const tokenAllowance = await tokenInstance.allowance(userAddress, this._contract.address);
    const depositAmount = await this.denomination;

    logger.log('tokenAllowance', tokenAllowance);
    logger.log('depositAmount', depositAmount);

    if (tokenAllowance < depositAmount) {
      return true;
    }

    return false;
  }

  async isWrappableTokenApprovalRequired (tokenAddress: string) {
    // Native token never requires approval
    if (tokenAddress === zeroAddress) return false;

    const userAddress = await this.signer.getAddress();
    const webbToken = await this.getWebbToken();
    const tokenAllowance = await webbToken.allowance(userAddress, webbToken.address);
    const depositAmount = await this.denomination;

    if (tokenAllowance < depositAmount) {
      return true;
    }

    return false;
  }

  async hasEnoughBalance (tokenAddress?: string) {
    const userAddress = await this.signer.getAddress();
    const depositAmount = await this.denomination;
    let tokenBalance: BigNumber;

    // If a token address was supplied, the user is querying for enough balance of a wrappableToken
    if (tokenAddress) {
      // query for native balance
      if (tokenAddress === zeroAddress) {
        tokenBalance = await this.signer.getBalance();
      } else {
        const tokenInstance = ERC20Factory.connect(tokenAddress, this.signer);

        tokenBalance = await tokenInstance.balanceOf(userAddress);
      }
    } else {
      // Querying for balance of the webbToken
      const tokenInstance = await this.getWebbToken();

      tokenBalance = await tokenInstance.balanceOf(userAddress);
    }

    if (tokenBalance < depositAmount) {
      return false;
    }

    return true;
  }

  async approve (tokenInstance: Contract, onComplete?: (event: DepositEvent) => void) {
    // check the approved spending before attempting deposit
    if (tokenInstance == null) return;

    if (tokenInstance != null) {
      const depositAmount = await this.denomination;
      const tx = await tokenInstance.approve(this._contract.address, depositAmount);

      await tx.wait();
    }
  }

  async deposit (commitment: string, _onComplete?: (event: DepositEvent) => void) {
    const overrides = {};
    const recipient = await this._contract.deposit(commitment, overrides);

    await recipient.wait();
  }

  async wrapAndDeposit (commitment: string, tokenAddress: string) {
    const value = await this._contract.denomination();

    if (tokenAddress === zeroAddress) {
      const overrides = { value: value };

      const tx = await this._contract.wrapAndDeposit(zeroAddress, commitment, overrides);

      await tx.wait();
      logger.log('wrapAndDeposit completed for native token to webb token');
    } else {
      const overrides = {};

      const tx = await this._contract.wrapAndDeposit(tokenAddress, commitment, overrides);

      await tx.wait();
      logger.log('wrapAndDeposit completed for wrappable asset to webb token');
    }
  }

  // Verify the leaf occurred at the reported block
  // This is important to check the behavior of relayers before modifying local storage
  async leafCreatedAtBlock (leaf: string, blockNumber: number): Promise<boolean> {
    const filter = this._contract.filters.Deposit(null, null, null);
    const logs = await this.web3Provider.getLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
      ...filter
    });
    const events = logs.map((log) => this._contract.interface.parseLog(log));

    for (let i = 0; i < events.length; i++) {
      if (events[i].args.commitment === leaf) {
        return true;
      }
    }

    return false;
  }

  async getDepositLeaves (
    startingBlock: number,
    finalBlock: number
  ): Promise<{ lastQueriedBlock: number; newLeaves: string[] }> {
    const filter = this._contract.filters.Deposit(null, null, null);

    logger.trace('Getting leaves with filter', filter);
    finalBlock = finalBlock || (await this.web3Provider.getBlockNumber());
    logger.info(`finalBlock detected as: ${finalBlock}`);

    let logs: Array<Log> = []; // Read the stored logs into this variable
    const step = 1024;

    logger.info(`Fetching leaves with steps of ${step} logs/request`);

    try {
      for (let i = startingBlock; i < finalBlock; i += step) {
        const nextLogs = await retryPromise(() => {
          return this.web3Provider.getLogs({
            fromBlock: i,
            toBlock: finalBlock - i > step ? i + step : finalBlock,
            ...filter
          });
        });

        logs = [...logs, ...nextLogs];

        logger.log(`Getting logs for block range: ${i} through ${i + step}`);
      }
    } catch (e) {
      logger.error(e);
      throw e;
    }

    const events = logs.map((log) => this._contract.interface.parseLog(log));

    const newCommitments = events
      .sort((a, b) => a.args.leafIndex - b.args.leafIndex) // Sort events in chronological order
      .map((e) => e.args.commitment);

    return {
      lastQueriedBlock: finalBlock,
      newLeaves: newCommitments
    };
  }

  /*
   * Generate Merkle Proof
   *  This will
   *  1- Create the merkle tree with the leaves in local storage
   *  2- Fetch the missing leaves
   *  3- Insert the missing leaves
   *  4- Compare against historical roots before adding to local storage
   *  5- return the path to the leaf.
   * */

  async generateMerkleProof (deposit: Deposit) {
    const bridgeStorageStorage = await bridgeCurrencyBridgeStorageFactory();
    const storedContractInfo: MixerStorage[0] = (await bridgeStorageStorage.get(
      this._contract.address.toLowerCase()
    )) || {
      lastQueriedBlock: anchorDeploymentBlock[this._contract.address.toString().toLowerCase()] || 0,
      leaves: [] as string[]
    };
    const treeHeight = await this._contract.levels();

    logger.trace(`Generating merkle proof treeHeight ${treeHeight} of deposit`, deposit);
    const tree = MerkleTree.new('eth', treeHeight, storedContractInfo.leaves, new PoseidonHasher());

    // Query for missing blocks starting from the stored endingBlock
    const lastQueriedBlock = storedContractInfo.lastQueriedBlock;

    logger.trace('Getting leaves from lastQueriedBlock ', lastQueriedBlock);
    const fetchedLeaves = await this.getDepositLeaves(lastQueriedBlock + 1, 0);

    logger.trace(`New Leaves ${fetchedLeaves.newLeaves.length}`, fetchedLeaves.newLeaves);

    tree.batchInsert(fetchedLeaves.newLeaves);

    const newRoot = tree.getRoot();
    const formattedRoot = bufferToFixed(newRoot);
    const lastRoot = await this._contract.getLastRoot();
    const knownRoot = await this._contract.isKnownRoot(formattedRoot);

    logger.info(`fromBlock ${formattedRoot} -x- last root ${lastRoot} ---> knownRoot: ${knownRoot}`);
    // compare root against contract, and store if there is a match
    const leaves = [...storedContractInfo.leaves, ...fetchedLeaves.newLeaves];

    if (knownRoot) {
      logger.info(`Root is known committing to storage ${this._contract.address}`);
      await bridgeStorageStorage.set(this._contract.address.toLowerCase(), {
        lastQueriedBlock: fetchedLeaves.lastQueriedBlock,
        leaves
      });
    }

    logger.trace(`Getting leaf index  of ${deposit.commitment}`, leaves);
    const leafIndex = leaves.findIndex((commitment) => commitment === deposit.commitment);

    logger.info(`Leaf index ${leafIndex}`);

    return tree.path(leafIndex);
  }

  async generateLinkedMerkleProof (sourceDeposit: Deposit, sourceLeaves: string[], sourceChainId: number) {
    // Grab the root of the source chain to prove against
    const edgeIndex = await this._contract.edgeIndex(sourceChainId);
    const edge = await this._contract.edgeList(edgeIndex);

    logger.log('retrieved edge while generating merkle proof: ', edge);
    const latestSourceRoot = edge[1];

    const tree = AnchorContract.createTreeWithRoot(sourceLeaves, latestSourceRoot);

    if (tree) {
      const index = tree.getIndexOfElement(sourceDeposit.commitment);

      console.log('index of element: ', index);
      const path = tree.path(index);

      logger.log('path for proof: ', path);

      return path;
    }

    return undefined;
  }

  async merkleProofToZKP (
    merkleProof: any,
    sourceEvmId: number,
    deposit: Deposit,
    zkpInputWithoutMerkleProof: ZKPWebbAnchorInputWithoutMerkle
  ) {
    const { pathElements, pathIndex: pathIndices, root: merkleRoot } = merkleProof;
    const localRoot = await this._contract.getLastRoot();
    const nr = await this._contract.getLatestNeighborRoots();
    const sourceChainRootIndex = (await this._contract.edgeIndex(sourceEvmId)).toNumber();
    const root = bufferToFixed(merkleRoot);
    // create a mutable copy of the returned neighbor roots and overwrite the root used
    // in the merkle proof
    const neighborRoots = [...nr];

    neighborRoots[sourceChainRootIndex] = root;
    const input: AnchorWitnessInput = {
      // public
      chainID: BigInt(zkpInputWithoutMerkleProof.destinationChainId),
      fee: String(zkpInputWithoutMerkleProof.fee),
      nullifier: deposit.nullifier,
      nullifierHash: deposit.nullifierHash,
      pathElements,
      pathIndices,
      recipient: zkpInputWithoutMerkleProof.recipient,
      refreshCommitment: bufferToFixed('0'),
      // private
      refund: String(zkpInputWithoutMerkleProof.refund),
      relayer: zkpInputWithoutMerkleProof.relayer,
      roots: [localRoot, ...neighborRoots],
      secret: deposit.secret
    };
    const edges = await this._contract.maxEdges();

    logger.trace(`Generate witness with edges ${edges}`, input);
    const witness = await generateWitness(input, edges as any);

    logger.trace('Generated witness', witness);
    const proof = await proofAndVerify(witness, edges as any);

    logger.trace('Zero knowlage proof', proof);

    return { input, proof: proof.proof, root };
  }

  async generateZKP (deposit: Deposit, zkpInputWithoutMerkleProof: ZKPWebbAnchorInputWithoutMerkle) {
    logger.trace('Generate zkp with args', { deposit, zkpInputWithoutMerkleProof });
    /// which merkle root is the neighbor
    const merkleProof = await this.generateMerkleProof(deposit);

    logger.trace('Merkle proof ', merkleProof);
    const { pathElements, pathIndex: pathIndices, root } = merkleProof;
    const nr = await this._contract.getLatestNeighborRoots();

    logger.trace('Latest Neighbor Roots', nr);
    const input: AnchorWitnessInput = {
      // public
      chainID: BigInt(deposit.chainId!),
      fee: String(zkpInputWithoutMerkleProof.fee),
      nullifier: deposit.nullifier,
      nullifierHash: deposit.nullifierHash,
      pathElements,
      pathIndices,
      recipient: zkpInputWithoutMerkleProof.recipient,
      refreshCommitment: bufferToFixed('0'),
      // private
      refund: String(zkpInputWithoutMerkleProof.refund),
      relayer: zkpInputWithoutMerkleProof.relayer,
      roots: [root, ...nr],
      secret: deposit.secret
    };
    const edges = await this._contract.maxEdges();

    logger.trace(`Generate witness with edges ${edges}`, input);
    const witness = await generateWitness(input, edges as any);

    logger.trace('Generated witness', witness);
    const proof = await proofAndVerify(witness, edges as any);

    logger.trace('Zero knowlage proof', proof);

    return { input, proof: proof.proof, root };
  }

  async withdraw (proof: any, zkp: ZKPWebbAnchorInputWithMerkle, pub: any): Promise<string> {
    const overrides = {
      gasLimit: 6000000
    };
    const proofBytes = await generateWithdrawProofCallData(proof, pub);
    const nullifierHash = bufferToFixed(zkp.nullifierHash);
    const roots = createRootsBytes(pub.roots);
    const extDataHash = getFixedAnchorExtDataHash({
      _fee: bufferToFixed(zkp.fee),
      _recipient: zkp.recipient,
      _refreshCommitment: bufferToFixed('0'),
      _refund: bufferToFixed(zkp.refund),
      _relayer: zkp.relayer
    });
    const tx = await this._contract.withdraw(
      {
        _extDataHash: extDataHash.toHexString(),
        _nullifierHash: nullifierHash,
        _roots: roots,
        proof: `0x${proofBytes}`
      },
      {
        _fee: bufferToFixed(zkp.fee),
        _recipient: zkp.recipient,
        _refreshCommitment: bufferToFixed('0'),
        _refund: bufferToFixed(zkp.refund),
        _relayer: zkp.relayer
      },
      overrides
    );
    const receipt = await tx.wait();

    return receipt.transactionHash;
  }

  /* wrap and unwrap */
}
