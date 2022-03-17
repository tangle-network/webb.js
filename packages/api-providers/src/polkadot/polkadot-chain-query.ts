import { WebbPolkadot } from './webb-polkadot-provider';
import { ChainQuery } from '../webb-context/chain-query';
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
