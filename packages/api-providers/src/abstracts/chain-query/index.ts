// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// The chain query class returns information from the selected provider

import { InternalChainId } from '@webb-tools/api-providers/index.js';

import { WebbCurrencyId } from '../../enums/index.js';

export abstract class ChainQuery<Provider> {
  constructor (protected inner: Provider) {}

  abstract tokenBalanceByCurrencyId(chainId: InternalChainId, currency: WebbCurrencyId): Promise<string>;
  abstract tokenBalanceByAddress(address: string): Promise<string>;
}
