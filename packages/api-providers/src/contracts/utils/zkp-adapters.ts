// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { bufferToFixed, Deposit } from '../utils/index.js';
import { ZKPTornPublicInputs } from '../wrappers/index.js';

export type ZKPTornFromDepositInput = {
  relayer?: string;
  recipient: string;
  refund?: number;
  fee?: number;
};

export function fromDepositIntoZKPTornPublicInputs (
  deposit: Deposit,
  data: ZKPTornFromDepositInput
): ZKPTornPublicInputs {
  return {
    fee: data.fee || 0,
    // public
    nullifierHash: deposit.nullifierHash,
    recipient: data.recipient,
    refund: data.refund || 0,
    relayer: data.relayer ? data.relayer : bufferToFixed(0)
  };
}
