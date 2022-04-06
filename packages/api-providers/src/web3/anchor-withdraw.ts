// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { parseUnits } from '@ethersproject/units';
import { Bridge, OptionalActiveRelayer, OptionalRelayer, RelayedWithdrawResult, RelayerCMDBase, WebbRelayer, WithdrawState } from '@webb-tools/api-providers/index.js';
import { anchorDeploymentBlock, bridgeCurrencyBridgeStorageFactory, chainIdToRelayerName, getAnchorAddressForBridge, getEVMChainName, getEVMChainNameFromInternal, MixerStorage } from '@webb-tools/api-providers/utils/index.js';
import { LoggerService } from '@webb-tools/app-util/index.js';
import { Note } from '@webb-tools/sdk-core/index.js';
import { JsNote as DepositNote } from '@webb-tools/wasm-utils';
import { BigNumber } from 'ethers';

import { AnchorWithdraw } from '../abstracts/index.js';
import { chainTypeIdToInternalId, evmIdIntoInternalChainId, InternalChainId, parseChainIdType } from '../chains/index.js';
import { generateWithdrawProofCallData, hexStringToBytes } from '../contracts/utils/bridge-utils.js';
import { bufferToFixed } from '../contracts/utils/buffer-to-fixed.js';
import { depositFromAnchorNote } from '../contracts/utils/make-deposit.js';
import { AnchorContract, ZKPWebbAnchorInputWithoutMerkle } from '../contracts/wrappers/index.js';
import { webbCurrencyIdFromString } from '../enums/index.js';
import { Web3Provider } from '../ext-providers/index.js';
import { WebbError, WebbErrorCodes } from '../webb-error/index.js';
import { WebbWeb3Provider } from './webb-provider.js';

const logger = LoggerService.get('Web3BridgeWithdraw');

export class Web3AnchorWithdraw extends AnchorWithdraw<WebbWeb3Provider> {
  protected get config () {
    return this.inner.config;
  }

  async mapRelayerIntoActive (relayer: OptionalRelayer): Promise<OptionalActiveRelayer> {
    if (!relayer) {
      return null;
    }

    const evmId = await this.inner.getChainId();
    const chainId = evmIdIntoInternalChainId(evmId);

    return WebbRelayer.intoActiveWebRelayer(
      relayer,
      {
        basedOn: 'evm',
        chain: chainId
      },
      // Define the function for retrieving fee information for the relayer
      async (note: string) => {
        const depositNote = await Note.deserialize(note);
        const evmNote = depositNote.note;
        const internalId = chainTypeIdToInternalId(parseChainIdType(Number(depositNote.note.targetChainId)));
        const contractAddress = await getAnchorAddressForBridge(
          webbCurrencyIdFromString(evmNote.tokenSymbol),
          internalId,
          Number(evmNote.amount),
          this.config.bridgeByAsset
        );

        if (!contractAddress) {
          throw new Error('Unsupported configuration for bridge');
        }

        // Given the note, iterate over the relayer's supported contracts and find the corresponding configuration
        // for the contract.
        const supportedContract = relayer.capabilities.supportedChains.evm
          .get(internalId)
          ?.contracts.find(({ address, size }) => {
            // Match on the relayer configuration as well as note
            return address.toLowerCase() === contractAddress.toLowerCase() && size === Number(evmNote.amount);
          });

        // The user somehow selected a relayer which does not support the mixer.
        // This should not be possible as only supported mixers should be selectable in the UI.
        if (!supportedContract) {
          throw WebbError.from(WebbErrorCodes.RelayerUnsupportedMixer);
        }

        const principleBig = parseUnits(supportedContract.size.toString(), evmNote.denomination);
        const withdrawFeeMill = supportedContract.withdrawFeePercentage * 1000000;

        const withdrawFeeMillBig = BigNumber.from(withdrawFeeMill);
        const feeBigMill = principleBig.mul(withdrawFeeMillBig);

        const feeBig = feeBigMill.div(BigNumber.from(1000000));

        return {
          totalFees: feeBig.toString(),
          withdrawFeePercentage: supportedContract.withdrawFeePercentage
        };
      }
    );
  }

  async getRelayersByChainAndAddress (chainId: InternalChainId, address: string) {
    return this.inner.relayingManager.getRelayer({
      baseOn: 'evm',
      chainId: chainId,
      contractAddress: address
    });
  }

  get relayers () {
    return this.inner.getChainId().then((evmId) => {
      const chainId = evmIdIntoInternalChainId(evmId);

      return this.inner.relayingManager.getRelayer({
        baseOn: 'evm',
        chainId
      });
    });
  }

  async getRelayersByNote (evmNote: Note) {
    const chainTypeId = Number(evmNote.note.targetChainId);
    const internalId = chainTypeIdToInternalId(parseChainIdType(chainTypeId));

    return this.inner.relayingManager.getRelayer({
      baseOn: 'evm',
      bridgeSupport: {
        amount: Number(evmNote.note.amount),
        tokenSymbol: evmNote.note.tokenSymbol
      },
      chainId: internalId
    });
  }

  async sameChainWithdraw (note: DepositNote, recipient: string): Promise<string> {
    this.cancelToken.cancelled = false;

    const bridgeCurrencyId = webbCurrencyIdFromString(note.tokenSymbol);
    const bridge = Bridge.from(bridgeCurrencyId, this.inner.config);

    const activeChain = await this.inner.getChainId();
    const internalId = evmIdIntoInternalChainId(activeChain);

    const contractAddresses = bridge.anchors.find((anchor) => anchor.amount === note.amount)!;
    const contractAddress = contractAddresses.anchorAddresses[internalId]!;

    const contract = this.inner.getWebbAnchorByAddress(contractAddress);
    const accounts = await this.inner.accounts.accounts();
    const account = accounts[0];

    const deposit = depositFromAnchorNote(note);

    logger.info(`Commitment for withdraw is ${deposit.commitment}`);

    const input = {
      destinationChainId: activeChain,
      fee: 0,
      nullifier: deposit.nullifier,
      // Todo change this to the RELAYER address
      nullifierHash: deposit.nullifierHash,
      recipient: account.address,
      refund: 0,
      relayer: account.address,
      secret: deposit.secret
    };

    logger.trace('input for zkp', input);
    const section = `Bridge ${bridge.currency
      .getChainIds()
      .map((id) => getEVMChainNameFromInternal(this.config, id))
      .join('-')}`;
    const key = 'web3-bridge-withdraw';

    this.emit('stateChange', WithdrawState.GeneratingZk);
    const zkpResults = await contract.generateZKP(deposit, input);

    this.inner.notificationHandler({
      description: 'Withdraw in progress',
      key,
      level: 'loading',
      message: `${section}:withdraw`,
      name: 'Transaction'
    });

    // Check for cancelled here, abort if it was set.
    if (this.cancelToken.cancelled) {
      this.inner.notificationHandler({
        description: 'Withdraw canceled',
        key,
        level: 'error',
        message: `${section}:withdraw`,
        name: 'Transaction'
      });
      this.emit('stateChange', WithdrawState.Ideal);

      return '';
    }

    let txHash = '';

    this.emit('stateChange', WithdrawState.SendingTransaction);

    try {
      txHash = await contract.withdraw(
        zkpResults.proof,
        {
          destinationChainId: Number(note.targetChainId),
          fee: input.fee,
          nullifier: input.nullifier,
          nullifierHash: input.nullifierHash,
          pathElements: zkpResults.input.pathElements,
          pathIndices: zkpResults.input.pathIndices,
          recipient: input.recipient,
          refund: input.refund,
          relayer: input.relayer,
          root: zkpResults.root as any,
          secret: zkpResults.input.secret
        },
        zkpResults.input
      );
    } catch (e) {
      this.emit('stateChange', WithdrawState.Ideal);

      this.inner.notificationHandler({
        description: (e as any)?.code === 4001 ? 'Withdraw rejected' : 'Withdraw failed',
        key,
        level: 'error',
        message: `${section}:withdraw`,
        name: 'Transaction'
      });

      return txHash;
    }

    this.emit('stateChange', WithdrawState.Ideal);
    this.inner.notificationHandler({
      description: recipient,
      key,
      level: 'success',
      message: `${section}:withdraw`,
      name: 'Transaction'
    });

    return '';
  }

  async crossChainWithdraw (note: DepositNote, recipient: string) {
    this.cancelToken.cancelled = false;
    // TODO: handle provider storage
    // const bridgeStorageStorage = await bridgeCurrencyBridgeStorageFactory();
    const bridgeStorageStorage = await bridgeCurrencyBridgeStorageFactory();

    // Setup a provider for the source chain
    const sourceChainIdType = parseChainIdType(Number(note.sourceChainId));
    const sourceEvmId = sourceChainIdType.chainId;
    const sourceInternalId = evmIdIntoInternalChainId(sourceEvmId);
    const sourceChainConfig = this.config.chains[sourceInternalId];
    const rpc = sourceChainConfig.url;
    const sourceHttpProvider = Web3Provider.fromUri(rpc);
    const sourceEthers = sourceHttpProvider.intoEthersProvider();

    // get info from the destination chain (should be selected)
    const destChainIdType = parseChainIdType(Number(note.targetChainId));
    const destInternalId = chainTypeIdToInternalId(destChainIdType);

    // get the deposit info
    const sourceDeposit = depositFromAnchorNote(note);

    this.emit('stateChange', WithdrawState.GeneratingZk);

    // Getting contracts data for source and dest chains
    const bridgeCurrency = this.inner.methods.anchorApi.currency;
    // await this.inner.methods.bridgeApi.setActiveBridge()
    const availableAnchors = await this.inner.methods.anchorApi.getAnchors();

    console.log('availableAnchors length: ', availableAnchors.length);
    const selectedAnchor = availableAnchors.find((anchor) => anchor.amount === note.amount);
    const destContractAddress = selectedAnchor?.neighbours[destInternalId]! as string;
    const sourceContractAddress = selectedAnchor?.neighbours[sourceInternalId]! as string;

    const activeChain = await this.inner.getChainId();

    // get root and neighbour root from the dest provider
    const destAnchor = this.inner.getWebbAnchorByAddress(destContractAddress);

    // Building the merkle proof
    const sourceContract = this.inner.getWebbAnchorByAddressAndProvider(sourceContractAddress, sourceEthers);
    const sourceLatestRoot = await sourceContract.inner.getLastRoot();

    logger.trace(`Source latest root ${sourceLatestRoot}`);

    // get relayers for the source chain
    const sourceRelayers = this.inner.relayingManager.getRelayer({
      baseOn: 'evm',
      bridgeSupport: {
        amount: Number(note.amount),
        tokenSymbol: note.tokenSymbol
      },
      chainId: chainTypeIdToInternalId(parseChainIdType(Number(note.sourceChainId)))
    });

    let leaves: string[] = [];

    // loop through the sourceRelayers to fetch leaves
    for (let i = 0; i < sourceRelayers.length; i++) {
      const relayerLeaves = await sourceRelayers[i].getLeaves(sourceEvmId.toString(16), sourceContractAddress);

      const validLatestLeaf = await sourceContract.leafCreatedAtBlock(
        relayerLeaves.leaves[relayerLeaves.leaves.length - 1],
        relayerLeaves.lastQueriedBlock
      );

      console.log('validLatestLeaf: ', validLatestLeaf);

      // leaves from relayer somewhat validated, attempt to build the tree
      if (validLatestLeaf) {
        const tree = AnchorContract.createTreeWithRoot(relayerLeaves.leaves, sourceLatestRoot);

        // If we were able to build the tree, set local storage and break out of the loop
        if (tree) {
          console.log('tree valid, using relayer leaves');
          leaves = relayerLeaves.leaves;

          await bridgeStorageStorage.set(sourceContract.inner.address.toLowerCase(), {
            lastQueriedBlock: relayerLeaves.lastQueriedBlock,
            leaves: relayerLeaves.leaves
          });
          break;
        }
      }
    }

    // if we weren't able to get leaves from the relayer, get them directly from chain
    if (!leaves.length) {
      // check if we already cached some values
      const storedContractInfo: MixerStorage[0] = (await bridgeStorageStorage.get(
        sourceContractAddress.toLowerCase()
      )) || {
        lastQueriedBlock: anchorDeploymentBlock[sourceContractAddress.toLowerCase()] || 0,
        leaves: [] as string[]
      };

      const leavesFromChain = await sourceContract.getDepositLeaves(storedContractInfo.lastQueriedBlock + 1, 0);

      leaves = [...storedContractInfo.leaves, ...leavesFromChain.newLeaves];
    }

    // generate the merkle proof
    const merkleProof = await destAnchor.generateLinkedMerkleProof(sourceDeposit, leaves, sourceEvmId);

    if (!merkleProof) {
      this.emit('stateChange', WithdrawState.Ideal);
      throw new Error('Failed to generate Merkle proof');
    }

    // Check for cancelled here, abort if it was set.
    if (this.cancelToken.cancelled) {
      this.inner.notificationHandler({
        description: 'Withdraw cancelled',
        key: 'mixer-withdraw-evm',
        level: 'error',
        message: 'bridge:withdraw',
        name: 'Transaction'
      });
      this.emit('stateChange', WithdrawState.Ideal);

      return '';
    }

    const accounts = await this.inner.accounts.accounts();
    const account = accounts[0];

    this.emit('stateChange', WithdrawState.SendingTransaction);
    let txHash: string;
    const activeRelayer = this.activeRelayer[0];

    if (activeRelayer && activeRelayer !== null && (activeRelayer?.account || activeRelayer?.beneficiary)) {
      logger.log('withdrawing through relayer');
      const input: ZKPWebbAnchorInputWithoutMerkle = {
        destinationChainId: Number(note.targetChainId),
        fee: 0,
        nullifier: sourceDeposit.nullifier,
        nullifierHash: sourceDeposit.nullifierHash,

        recipient: recipient,
        refund: 0,
        relayer: String(activeRelayer?.beneficiary ? activeRelayer?.beneficiary : activeRelayer?.account!),
        secret: sourceDeposit.secret
      };

      let zkp;

      try {
        zkp = await destAnchor.merkleProofToZKP(merkleProof, sourceEvmId, sourceDeposit, input);
      } catch (e) {
        console.log(e);
        this.emit('stateChange', WithdrawState.Ideal);

        this.inner.notificationHandler({
          description: 'Deposit not yet available',
          key: 'mixer-withdraw-evm',
          level: 'error',
          message: 'bridge:withdraw',
          name: 'Transaction'
        });

        return '';
      }

      // convert the proof to solidity calldata
      const proofBytes = await generateWithdrawProofCallData(zkp.proof, zkp.input);

      // convert the roots into the format the relayer expects
      const roots = zkp.input.roots.map((root: string) => {
        return root.substr(2);
      });
      const relayerRootString = roots.join('');
      const relayerRootsBytes = hexStringToBytes(relayerRootString);
      const relayerRoots = Array.from(relayerRootsBytes);

      const relayedWithdraw = await activeRelayer.initWithdraw('anchorRelayTx');

      logger.trace('initialized the withdraw WebSocket');

      const chainInfo = {
        baseOn: 'evm' as RelayerCMDBase,
        contractAddress: destContractAddress,
        endpoint: '',
        name: chainIdToRelayerName(destInternalId)
      };

      const tx = relayedWithdraw.generateWithdrawRequest<typeof chainInfo, 'anchorRelayTx'>(
        chainInfo,
        `0x${proofBytes}`,
        {
          chain: chainInfo.name,
          contract: chainInfo.contractAddress,
          fee: bufferToFixed(zkp.input.fee),
          nullifierHash: bufferToFixed(zkp.input.nullifierHash),
          recipient: zkp.input.recipient,
          refreshCommitment: '0x0000000000000000000000000000000000000000000000000000000000000000',
          refund: bufferToFixed(zkp.input.refund),
          relayer: zkp.input.relayer,
          roots: relayerRoots
        }
      );

      relayedWithdraw.watcher.subscribe(([nextValue, message]) => {
        switch (nextValue) {
          case RelayedWithdrawResult.PreFlight:
          case RelayedWithdrawResult.OnFlight:
            this.emit('stateChange', WithdrawState.SendingTransaction);
            break;
          case RelayedWithdrawResult.Continue:
            break;
          case RelayedWithdrawResult.CleanExit:
            this.emit('stateChange', WithdrawState.Done);
            this.emit('stateChange', WithdrawState.Ideal);

            this.inner.notificationHandler({
              description: 'Withdraw success',
              key: 'mixer-withdraw-evm',
              level: 'success',
              message: 'bridge:withdraw',
              name: 'Transaction'
            });

            break;
          case RelayedWithdrawResult.Errored:
            this.emit('stateChange', WithdrawState.Failed);
            this.emit('stateChange', WithdrawState.Ideal);

            this.inner.notificationHandler({
              description: message || 'Withdraw failed',
              key: 'mixer-withdraw-evm',
              level: 'error',
              message: 'bridge:withdraw',
              name: 'Transaction'
            });

            break;
        }
      });
      logger.trace('Sending transaction');
      // stringify the request
      const data = JSON.stringify(tx);

      console.log(data);

      relayedWithdraw.send(tx);
      const txResult = await relayedWithdraw.await();

      if (!txResult || !txResult?.[1]) {
        return '';
      }

      txHash = txResult?.[1] || '';
    } else {
      try {
        logger.log('withdrawing without relayer');

        const input = {
          destinationChainId: Number(note.targetChainId),
          fee: 0,
          nullifier: sourceDeposit.nullifier,
          nullifierHash: sourceDeposit.nullifierHash,
          // Todo change this to the realyer address

          recipient: recipient,
          refund: 0,
          relayer: account.address,
          secret: sourceDeposit.secret
        };

        let zkpResults;

        try {
          zkpResults = await destAnchor.merkleProofToZKP(merkleProof, sourceEvmId, sourceDeposit, input);
        } catch (e) {
          console.log(e);
          this.emit('stateChange', WithdrawState.Ideal);

          this.inner.notificationHandler({
            description: 'Deposit not yet available',
            key: 'mixer-withdraw-evm',
            level: 'error',
            message: 'bridge:withdraw',
            name: 'Transaction'
          });

          return '';
        }

        txHash = await destAnchor.withdraw(
          zkpResults.proof,
          {
            destinationChainId: activeChain,
            fee: input.fee,
            nullifier: input.nullifier,
            nullifierHash: input.nullifierHash,
            pathElements: zkpResults.input.pathElements,
            pathIndices: zkpResults.input.pathIndices,
            recipient: input.recipient,
            refund: input.refund,
            relayer: input.relayer,
            root: zkpResults.root,
            secret: zkpResults.input.secret
          },
          zkpResults.input
        );
      } catch (e) {
        this.emit('stateChange', WithdrawState.Ideal);
        this.inner.notificationHandler({
          description: (e as any)?.code === 4001 ? 'Withdraw rejected' : 'Withdraw failed',
          key: 'bridge-withdraw-evm',
          level: 'error',
          message: `Bridge ${bridgeCurrency
            ?.getChainIds()
            .map((id) => getEVMChainNameFromInternal(this.config, id))
            .join('-')}:withdraw`,
          name: 'Transaction'
        });

        return '';
      }
    }

    this.inner.notificationHandler({
      description: 'Withdraw done',
      key: 'bridge-withdraw-evm',
      level: 'success',
      message: `Bridge ${bridgeCurrency
        ?.getChainIds()
        .map((id) => getEVMChainNameFromInternal(this.config, id))
        .join('-')}:withdraw`,
      name: 'Transaction'
    });

    this.emit('stateChange', WithdrawState.Done);
    this.emit('stateChange', WithdrawState.Ideal);

    return txHash;
  }

  async withdraw (note: string, recipient: string): Promise<string> {
    logger.trace(`Withdraw using note ${note} , recipient ${recipient}`);

    const parseNote = await Note.deserialize(note);
    const depositNote = parseNote.note;
    const sourceChainName = getEVMChainName(this.config, parseChainIdType(Number(depositNote.sourceChainId)).chainId);
    const targetChainName = getEVMChainName(this.config, parseChainIdType(Number(depositNote.targetChainId)).chainId);

    logger.trace(`Bridge withdraw from ${sourceChainName} to ${targetChainName}`);

    if (depositNote.sourceChainId === depositNote.targetChainId) {
      logger.trace(`Same chain flow ${sourceChainName}`);

      return this.sameChainWithdraw(depositNote, recipient);
    } else {
      logger.trace(`cross chain flow ${sourceChainName} ----> ${targetChainName}`);

      return this.crossChainWithdraw(depositNote, recipient);
    }
  }
}
