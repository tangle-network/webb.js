// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// Create custom types for pure javascript packages
declare module 'circomlibjs' {
  import type { BigNumber, BigNumberish } from 'ethers';

  export function poseidon(inputs: BigNumberish[]): BigNumber;
}

declare module 'elliptic';
declare module 'ffjavascript';
