// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// @ts-ignore
import circomlib from 'circomlibjs';

const hashLeftRight = (left: bigint, right: bigint) => {
  return circomlib.poseidon([left, right]);
};

export function poseidonHash3 (inputs: any[]) {
  if (inputs.length !== 3) {
    throw new Error('panic');
  }

  return circomlib.poseidon(inputs);
}

export class PoseidonHasher3 {
  hash (_level: any, left: any, right: any) {
    return hashLeftRight(BigInt(left), BigInt(right)).toString();
  }

  hash3 (inputs: any) {
    if (inputs.length !== 3) {
      throw new Error('panic');
    }

    return circomlib.poseidon(inputs);
  }
}
