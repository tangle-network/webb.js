// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { BigNumberish } from 'ethers';

export interface RootInfo {
  merkleRoot: BigNumberish;
  chainId: BigNumberish;
}

export type KNOWN_MODULES = 'merkle' | 'mixer';

export type CHAIN = 'dev' | 'webb';
