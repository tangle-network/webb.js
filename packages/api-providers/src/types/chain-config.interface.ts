import { ReactElement } from './abstracts';
import { ChainType } from '../chains';
import { WebbCurrencyId } from '../enums';

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
