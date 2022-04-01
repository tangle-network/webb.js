// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// @ts-ignore
import { poseidon } from 'circomlibjs';

import { Hasher } from './merkle-tree.js';

const hashLeftRight = (left: bigint, right: bigint) => {
  return poseidon([left, right]);
};

export class PoseidonHasher implements Hasher {
  hash (level: any, left: any, right: any): string {
    return hashLeftRight(BigInt(left), BigInt(right)).toString();
  }
}
