// The chain query class returns information from the selected provider
import { WebbCurrencyId } from '../enums';

export abstract class ChainQuery<Provider> {
  constructor(protected inner: Provider) {}

  abstract tokenBalanceByCurrencyId(currency: WebbCurrencyId): Promise<string>;
  abstract tokenBalanceByAddress(address: string): Promise<string>;
}
