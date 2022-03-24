import { Observable } from 'rxjs';
import { Amount, WrappingBalance, WrappingEvent, WrapUnWrap } from '@webb-tools/api-providers';
import { WebbPolkadot } from './webb-provider';
import { MixerSize } from '@webb-tools/api-providers';
import { WebbCurrencyId } from '../enums';

export class PolkadotWrapUnwrap extends WrapUnWrap<WebbPolkadot> {
  canWrap(wrapPayload: any): Promise<boolean> {
    return Promise.resolve(false);
  }

  getSizes(): Promise<MixerSize[]> {
    return Promise.resolve([]);
  }

  getTokensAddress(): Promise<string> {
    return Promise.resolve('');
  }

  unwrap(unwrapPayload: any): Promise<string> {
    return Promise.resolve('');
  }

  wrap(wrapPayload: any): Promise<string> {
    return Promise.resolve('');
  }

  get balances(): Observable<[WrappingBalance, WrappingBalance]> {
    return new Observable();
  }

  canUnWrap(unwrapPayload: Amount): Promise<boolean> {
    return Promise.resolve(false);
  }

  getGovernedTokens(): Promise<WebbCurrencyId[]> {
    return Promise.resolve([]);
  }

  getWrappableTokens(): Promise<WebbCurrencyId[]> {
    return Promise.resolve([]);
  }

  getWrappedTokens(): Promise<WebbCurrencyId[]> {
    return Promise.resolve([]);
  }

  get liquidity(): Observable<[WrappingBalance, WrappingBalance]> {
    return new Observable();
  }

  get subscription(): Observable<Partial<WrappingEvent>> {
    return new Observable();
  }
}
