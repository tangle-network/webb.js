// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainQuery } from '../abstracts/index.js';
import { WebbCurrencyId } from '../enums/index.js';
import { WebbPolkadot } from './webb-provider.js';

export class PolkadotChainQuery extends ChainQuery<WebbPolkadot> {
  constructor (protected inner: WebbPolkadot) {
    super(inner);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async tokenBalanceByCurrencyId (currency: WebbCurrencyId): Promise<string> {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async tokenBalanceByAddress (address: string): Promise<string> {
    return '';
  }
}
