// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainQuery } from '../abstracts';
import { WebbCurrencyId } from '../enums';
import { WebbPolkadot } from './webb-provider';

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
