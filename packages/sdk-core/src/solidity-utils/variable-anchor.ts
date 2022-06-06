/* eslint-disable camelcase */
/* eslint-disable sort-keys */
import { JsUtxo } from '@webb-tools/wasm-utils/wasm-utils';
import { BigNumber, BigNumberish, ethers } from 'ethers';

import { u8aToHex } from '@polkadot/util';

import { FIELD_SIZE } from '../big-number-utils.js';
import { MerkleProof, MerkleTree } from '../index.js';
import { Keypair } from '../keypair.js';

export function getVAnchorExtDataHash (
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
      recipient,
      extAmount,
      relayer,
      fee,
      encryptedOutput1,
      encryptedOutput2
    }]
  );
  const hash = ethers.utils.keccak256(encodedData);

  return BigNumber.from(hash).mod(FIELD_SIZE);
}

export function generateVariableWitnessInput (
  roots: BigNumber[],
  chainId: BigNumberish,
  inputs: JsUtxo[],
  outputs: JsUtxo[],
  extAmount: BigNumberish,
  fee: BigNumberish,
  extDataHash: BigNumber,
  externalMerkleProofs: MerkleProof[]
): any {
  const keypair1 = new Keypair(outputs[0].secret_key);
  const keypair2 = new Keypair(outputs[1].secret_key);

  const vanchorMerkleProofs = externalMerkleProofs.map((proof) => ({
    pathIndex: MerkleTree.calculateIndexFromPathIndices(proof.pathIndices),
    pathElements: proof.pathElements
  }));

  const input = {
    roots: roots.map((x) => x.toString()),
    chainID: chainId.toString(),
    inputNullifier: inputs.map((x) => x.nullifier),
    outputCommitment: outputs.map((x) => u8aToHex(x.commitment)),
    publicAmount: BigNumber.from(extAmount).sub(fee).add(FIELD_SIZE).mod(FIELD_SIZE).toString(),
    extDataHash: extDataHash.toString(),

    // data for 2 transaction inputs
    inAmount: inputs.map((x) => x.amount.toString()),
    inPrivateKey: inputs.map((x) => x.secret_key.toString()),
    inBlinding: inputs.map((x) => x.blinding.toString()),
    inPathIndices: vanchorMerkleProofs.map((x) => x.pathIndex),
    inPathElements: vanchorMerkleProofs.map((x) => x.pathElements),

    // data for 2 transaction outputs
    outChainID: outputs.map((x) => x.chainIdBytes),
    outAmount: outputs.map((x) => x.amount.toString()),
    outPubkey: [keypair1.pubkey.toString(), keypair2.pubkey.toString()],
    outBlinding: outputs.map((x) => x.blinding.toString())
  };

  return input;
}
