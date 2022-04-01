// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainType } from '../chains/index.js';
import { WebbCurrencyId } from '../enums/index.js';
import { ReactElement } from './abstracts.js';

export interface ChainConfig {
  id: number;
  chainType: ChainType;
  name: string;
  group: string;
  chainId: number;
  tag?: 'dev' | 'test' | 'live';
  url: string;
  evmRpcUrls?: string[];
  blockExplorerStub?: string;
  logo: ReactElement;
  nativeCurrencyId: WebbCurrencyId;
  currencies: Array<WebbCurrencyId>;
}
