// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { Hasher } from './merkle-tree';

const maci = require('maci-crypto');
const { hashLeftRight } = maci;

export class PoseidonHasher implements Hasher {
  hash (level: any, left: any, right: any): string {
    return hashLeftRight(BigInt(left), BigInt(right)).toString();
  }
}