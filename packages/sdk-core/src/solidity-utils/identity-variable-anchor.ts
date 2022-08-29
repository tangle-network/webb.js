/* eslint-disable camelcase */
/* eslint-disable sort-keys */
import { BigNumber, BigNumberish, ethers } from 'ethers';

import { u8aToHex } from '@polkadot/util';

import { FIELD_SIZE, toFixedHex } from '../big-number-utils.js';
import { MerkleProof, MerkleTree, Utxo } from '../index.js';
import { Keypair } from '../keypair.js';

export function getIdentityVAnchorExtDataHash (
  encryptedOutput1: string,
  encryptedOutput2: string,
  extAmount: string,
  fee: string,
  recipient: string,
  relayer: string
) {
  const abi = new ethers.utils.AbiCoder();
  const encodedData = abi.encode(
    ['tuple(address recipient,int256 extAmount,address relayer,uint256 fee,bytes encryptedOutput1,bytes encryptedOutput2)'],
    [{
      recipient: toFixedHex(recipient, 20),
      extAmount: toFixedHex(extAmount),
      relayer: toFixedHex(relayer, 20),
      fee: toFixedHex(fee),
      encryptedOutput1,
      encryptedOutput2
    }]
  );

  const hash = ethers.utils.keccak256(encodedData);

  return BigNumber.from(hash).mod(FIELD_SIZE);
}

export function generateIdentityVAnchorWitnessInput (
  privateKey: BigNumber,
  identityRoots: BigNumber[],
  vanchorRoots: BigNumber[],
  chainId: BigNumberish,
  inputs: Utxo[],
  outputs: Utxo[],
  extAmount: BigNumberish,
  fee: BigNumberish,
  extDataHash: BigNumber,
  identityMerkleProofs: MerkleProof[],
  vanchorMerkleProofs: MerkleProof[]
): any {
  const keypair1 = new Keypair(outputs[0].secret_key);
  const keypair2 = new Keypair(outputs[1].secret_key);

  const anchorMerkleProofs = vanchorMerkleProofs.map((proof) => ({
    pathIndex: MerkleTree.calculateIndexFromPathIndices(proof.pathIndices),
    pathElements: proof.pathElements
  }));

  const idMerkleProofs = identityMerkleProofs.map((proof) => ({
    pathIndex: MerkleTree.calculateIndexFromPathIndices(proof.pathIndices),
    pathElements: proof.pathElements
  }));

  const input = {
    semaphorePathIndices: idMerkleProofs.map((x) => x.pathIndex),
    semaphorePathElements: idMerkleProofs.map((x) => x.pathElements),
    semaphoreRoots: identityRoots.map((x) => x.toString()),
    chainID: chainId.toString(),
    inputNullifier: inputs.map((x) => BigNumber.from(x.nullifier).toString()),
    outputCommitment: outputs.map((x) => BigNumber.from(u8aToHex(x.commitment)).toString()),
    publicAmount: BigNumber.from(extAmount).sub(fee).add(FIELD_SIZE).mod(FIELD_SIZE).toString(),
    extDataHash: extDataHash.toString(),

    // data for 2 transaction inputs
    inAmount: inputs.map((x) => x.amount.toString()),
    inPrivateKey: inputs.map((x) => x.secret_key.toString()),
    inBlinding: inputs.map((x) => BigNumber.from(x.blinding).toString()),
    inPathIndices: anchorMerkleProofs.map((x) => x.pathIndex),
    inPathElements: anchorMerkleProofs.map((x) => x.pathElements),
    vanchorRoots: vanchorRoots.map((x) => x.toString()),

    // data for 2 transaction outputs
    outChainID: outputs.map((x) => x.chainId),
    outAmount: outputs.map((x) => x.amount.toString()),
    outPubkey: [toFixedHex(keypair1.pubkey), toFixedHex(keypair2.pubkey)],
    outBlinding: outputs.map((x) => BigNumber.from(x.blinding).toString())
  };

  return input;
}
