// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainQuery } from '../abstracts/index.js';
import { WebbCurrencyId } from '../enums/index.js';
import { WebbPolkadot } from './webb-provider.js';

export class PolkadotChainQuery extends ChainQuery<WebbPolkadot> {
  constructor (protected inner: WebbPolkadot) {
    super(inner);
  }

  async tokenBalanceByCurrencyId (currency: WebbCurrencyId): Promise<string> {
    return '';
  }

  async tokenBalanceByAddress (address: string): Promise<string> {
    return '';
  }
}
