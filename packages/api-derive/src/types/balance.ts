import { Balance, CurrencyId } from '@webb-tools/types/interfaces';

export interface DerivedBalance {
  currency: CurrencyId | string;
  balance: Balance;
}

export type DerivedAllBalances = DerivedBalance[];
