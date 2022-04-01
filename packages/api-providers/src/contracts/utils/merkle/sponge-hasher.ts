// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// @ts-ignore
import circomlib from 'tornado-circomlib';

import { Hasher } from './merkle-tree.js';

const { mimcsponge } = circomlib;

export class MimcSpongeHasher implements Hasher {
  hash (level: any, left: any, right: any) {
    return mimcsponge.multiHash([BigInt(left), BigInt(right)]).toString();
  }
}
