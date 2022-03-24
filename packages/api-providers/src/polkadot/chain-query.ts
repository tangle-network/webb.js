import { WebbPolkadot } from './webb-provider';
import { ChainQuery } from '../abstracts';
import { WebbCurrencyId } from '../enums';

export class PolkadotChainQuery extends ChainQuery<WebbPolkadot> {
  constructor(protected inner: WebbPolkadot) {
    super(inner);
  }

  async tokenBalanceByCurrencyId(currency: WebbCurrencyId): Promise<string> {
    return '';
  }

  async tokenBalanceByAddress(address: string): Promise<string> {
    return '';
  }
}
