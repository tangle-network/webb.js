// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { VAnchorWithdraw } from '@webb-tools/api-providers/index.js';

import { WebbPolkadot } from './index.js';

export class PolkadotVAnchorWithdraw extends VAnchorWithdraw<WebbPolkadot> {
  withdraw (note: string, recipient: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
