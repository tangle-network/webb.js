// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { InternalChainId } from '@webb-tools/api-providers/chains/chain-id.enum.js';

import { MixerWithdraw } from '../mixer/index.js';
import { WebbApiProvider } from '../webb-provider.interface.js';
import { Bridge } from './anchor.js';

export abstract class AnchorWithdraw<T extends WebbApiProvider<any>> extends MixerWithdraw<T> {
  get tokens () {
    return Bridge.getTokens(this.inner.config.currencies);
  }

  getTokensOfChain (chainId: InternalChainId) {
    return Bridge.getTokensOfChain(this.inner.config.currencies, chainId);
  }
}
