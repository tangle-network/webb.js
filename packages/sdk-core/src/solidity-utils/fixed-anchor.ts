/* eslint-disable camelcase */
/* eslint-disable sort-keys */
import { BigNumber, BigNumberish, ethers } from 'ethers';

import { FIELD_SIZE, toFixedHex } from '../big-number-utils.js';

export function getFixedAnchorExtDataHash (
  fee: BigNumberish,
  recipient: BigNumberish,
  refreshCommitment: BigNumberish,
  refund: BigNumberish,
  relayer: BigNumberish
) {
  const abi = new ethers.utils.AbiCoder();
  const encodedData = abi.encode(
    ['tuple(bytes32 refreshCommitment,address recipient,address relayer,uint256 fee,uint256 refund)'],
    [{
      refreshCommitment: toFixedHex(refreshCommitment),
      recipient: toFixedHex(recipient, 20),
      relayer: toFixedHex(relayer, 20),
      fee: toFixedHex(fee),
      refund: toFixedHex(refund)
    }]
  );
  const hash = ethers.utils.keccak256(encodedData);

  return BigNumber.from(hash).mod(FIELD_SIZE);
}

export function generateFixedWitnessInput (
  nullifier: string,
  nullifierHash: string,
  secret: string,
  chainID: string | number,
  refreshCommitment: string | number,
  recipient: string,
  relayer: string,
  fee: bigint,
  refund: bigint,
  roots: string[],
  pathElements: any[],
  pathIndices: any[]
): any {
  const extDataHash = getFixedAnchorExtDataHash(fee, recipient, refreshCommitment, refund, relayer);
  const input = {
    // public
    nullifierHash,
    extDataHash: extDataHash.toString(),
    chainID,
    roots,
    // private
    nullifier,
    secret,
    pathElements,
    pathIndices
  };

  return input;
}
