// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { Deposit } from '../utils/make-deposit';

export type AnchorInterface = {
  createDeposit(): Deposit;
  deposit(commitment: string): Promise<void>;
};
