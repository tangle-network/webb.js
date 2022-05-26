// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { InternalChainId } from '@webb-tools/api-providers/index.js';
import { EventBus } from '@webb-tools/app-util/index.js';

import { CancelToken, WebbWithdrawEvents, WithdrawState } from '../index.js';
import { WebbApiProvider } from '../webb-provider.interface.js';
import { Bridge } from './bridge.js';

export abstract class VAnchorWithdraw<T extends WebbApiProvider<any>> extends EventBus<WebbWithdrawEvents> {
  state: WithdrawState = WithdrawState.Ideal;
  cancelToken: CancelToken = { cancelled: false };

  constructor (protected inner: T) {
    super();
  }

  get tokens () {
    return Bridge.getTokens(this.inner.config.currencies);
  }

  getTokensOfChain (chainId: InternalChainId) {
    return Bridge.getTokensOfChain(this.inner.config.currencies, chainId);
  }

  cancelWithdraw (): Promise<void> {
    this.cancelToken.cancelled = true;
    this.emit('stateChange', WithdrawState.Cancelling);

    return Promise.resolve(undefined);
  }

  abstract withdraw(notes: string[], recipient: string, amount: string): Promise<string>;
}