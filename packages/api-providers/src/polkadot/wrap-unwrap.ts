// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { Amount, MixerSize, WrappingBalance, WrappingEvent } from '@webb-tools/api-providers';
import { Observable } from 'rxjs';

import { WrapUnWrap } from '../abstracts';
import { WebbCurrencyId } from '../enums';
import { WebbPolkadot } from './webb-provider';

export class PolkadotWrapUnwrap extends WrapUnWrap<WebbPolkadot> {
  canWrap (wrapPayload: any): Promise<boolean> {
    return Promise.resolve(false);
  }

  getSizes (): Promise<MixerSize[]> {
    return Promise.resolve([]);
  }

  getTokensAddress (): Promise<string> {
    return Promise.resolve('');
  }

  unwrap (unwrapPayload: any): Promise<string> {
    return Promise.resolve('');
  }

  wrap (wrapPayload: any): Promise<string> {
    return Promise.resolve('');
  }

  get balances (): Observable<[WrappingBalance, WrappingBalance]> {
    return new Observable();
  }

  canUnWrap (unwrapPayload: Amount): Promise<boolean> {
    return Promise.resolve(false);
  }

  getGovernedTokens (): Promise<WebbCurrencyId[]> {
    return Promise.resolve([]);
  }

  getWrappableTokens (): Promise<WebbCurrencyId[]> {
    return Promise.resolve([]);
  }

  getWrappedTokens (): Promise<WebbCurrencyId[]> {
    return Promise.resolve([]);
  }

  get liquidity (): Observable<[WrappingBalance, WrappingBalance]> {
    return new Observable();
  }

  get subscription (): Observable<Partial<WrappingEvent>> {
    return new Observable();
  }
}
