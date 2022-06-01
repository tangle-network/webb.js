// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable sort-keys */

import crypto from 'crypto';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import ffjavascript from 'ffjavascript';

const { leBuff2int } = ffjavascript.utils;

export const FIELD_SIZE = BigNumber.from(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

export const median = (arr: number[]): number => {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);

  return s.length % 2 === 0 ? ((s[mid - 1] + s[mid]) / 2) : s[mid];
};

export const mean = (arr: number[]) => arr.reduce((p, c) => p + c, 0) / arr.length;
export const max = (arr: number[]) => arr.reduce((a, b) => a > b ? a : b);
export const min = (arr: number[]) => arr.reduce((a, b) => a <= b ? a : b);

/** Generate random number of specified byte length */
export const randomBN = (nbytes = 31) => BigNumber.from(crypto.randomBytes(nbytes));

export const rbigint = (nbytes: number) => leBuff2int(crypto.randomBytes(nbytes));

export const toHex = (covertThis: ethers.utils.BytesLike | number | bigint, padding: number): string => {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(covertThis), padding);
};

/** BigNumber to hex string of specified length */
export function toFixedHex (number: BigNumberish, length = 32): string {
  let result =
    '0x' +
    (number instanceof Buffer
      ? number.toString('hex')
      : BigNumber.from(number.toString()).toHexString().replace('0x', '')
    ).padStart(length * 2, '0');

  if (result.indexOf('-') > -1) {
    result = '-' + result.replace('-', '');
  }

  return result;
}

/** Pad the bigint to 256 bits (32 bytes) */
export function p256 (n: bigint) {
  let nstr = BigInt(n).toString(16);

  while (nstr.length < 64) {
    nstr = '0' + nstr;
  }

  nstr = `"0x${nstr}"`;

  return nstr;
}

/** Convert value into buffer of specified byte length */
export const toBuffer = (value: BigNumberish, length: number) =>
  Buffer.from(
    BigNumber.from(value)
      .toHexString()
      .slice(2)
      .padStart(length * 2, '0'),
    'hex'
  );
