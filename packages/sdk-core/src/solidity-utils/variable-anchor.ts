/* eslint-disable camelcase */
/* eslint-disable sort-keys */
import { BigNumber, BigNumberish, ethers } from 'ethers';

import { u8aToHex } from '@polkadot/util';

import { FIELD_SIZE, toFixedHex } from '../big-number-utils.js';
import { MerkleProof, MerkleTree, Utxo } from '../index.js';

export function getVAnchorExtDataHash (
  encryptedOutput1: string,
  encryptedOutput2: string,
  extAmount: string,
  fee: string,
  recipient: string,
  relayer: string,
  refund: string,
  token: string
): BigNumber {
  const abi = new ethers.utils.AbiCoder();
  const encodedData = abi.encode(
    ['tuple(bytes recipient,bytes extAmount,bytes relayer,uint256 fee,uint256 refund,bytes token,bytes encryptedOutput1,bytes encryptedOutput2)'],
    [{
      // For recipient, since it is an Account (32 bytes) we use toFixedHex to pad it to 32 bytes.
      recipient: toFixedHex(recipient),
      // For extAmount, since it is an Amount (i128) it should be 16 bytes
      extAmount: toFixedHex(extAmount, 16),
      // For relayer, since it should be 32 bytes we use toFixedHex to pad it to 32 bytes.
      relayer: toFixedHex(relayer),
      // For fee, since it is a Balance (u128) it should be 16 bytes
      fee: toFixedHex(fee, 16),
      // For refund, since it is a Balance (u128) it should be 16 bytes
      refund: toFixedHex(refund, 16),
      // For token, since it is an Account (32 bytes) we use toFixedHex to pad it to 32 bytes.
      token: toFixedHex(token),
      encryptedOutput1,
      encryptedOutput2
    }]
  );

  const hash = ethers.utils.keccak256(encodedData);

  return BigNumber.from(hash).mod(FIELD_SIZE);
}

export function generateVariableWitnessInput (
  roots: BigNumberish[],
  chainId: BigNumberish,
  inputs: Utxo[],
  outputs: Utxo[],
  extAmount: BigNumberish,
  fee: BigNumberish,
  extDataHash: BigNumberish,
  externalMerkleProofs: MerkleProof[]
): any {
  const vanchorMerkleProofs = externalMerkleProofs.map((proof) => ({
    pathIndex: MerkleTree.calculateIndexFromPathIndices(proof.pathIndices),
    pathElements: proof.pathElements
  }));

  const input = {
    roots: roots.map((x) => x.toString()),
    chainID: chainId.toString(),
    inputNullifier: inputs.map((x) => '0x' + x.nullifier),
    outputCommitment: outputs.map((x) => BigNumber.from(u8aToHex(x.commitment)).toString()),
    publicAmount: BigNumber.from(extAmount).sub(fee).add(FIELD_SIZE).mod(FIELD_SIZE).toString(),
    extDataHash: extDataHash.toString(),

    // data for 2 transaction inputs
    inAmount: inputs.map((x) => x.amount.toString()),
    inPrivateKey: inputs.map((x) => '0x' + x.secret_key),
    inBlinding: inputs.map((x) => BigNumber.from('0x' + x.blinding).toString()),
    inPathIndices: vanchorMerkleProofs.map((x) => x.pathIndex),
    inPathElements: vanchorMerkleProofs.map((x) => x.pathElements),

    // data for 2 transaction outputs
    outChainID: outputs.map((x) => x.chainId),
    outAmount: outputs.map((x) => x.amount.toString()),
    outPubkey: outputs.map((x) => BigNumber.from(x.getKeypair().getPubKey()).toString()),
    outBlinding: outputs.map((x) => BigNumber.from('0x' + x.blinding).toString())
  };

  return input;
}
