// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { InternalChainId } from '../../chains/index.js';
import { CurrencyRole } from '../../types/currency-config.interface.js';
import { AppConfig } from '../common.js';
import { Currency } from '../currency/currency.js';

// This bridge class exposes methods which retrieve information from a passed config.
export class Bridge {
  /*
   *  Get all Bridge tokens
   * */
  static getTokens (currenciesConfig: AppConfig['currencies']): Currency[] {
    const bridgeCurrenciesConfig = Object.values(currenciesConfig).filter((i) => i.role === CurrencyRole.Governable);

    return bridgeCurrenciesConfig.map((config) => {
      return Currency.fromCurrencyId(currenciesConfig, config.id);
    });
  }

  /*
   *  Get all Bridge tokens for a given chain
   * */
  static getTokensOfChain (currenciesConfig: AppConfig['currencies'], chainId: InternalChainId): Currency[] {
    const tokens = Bridge.getTokens(currenciesConfig);

    return tokens.filter((token) => token.hasChain(chainId));
  }
}
