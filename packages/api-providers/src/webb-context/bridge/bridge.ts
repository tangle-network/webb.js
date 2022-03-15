import { Currency } from '../currency/currency';
import { BridgeConfig } from '../../types/bridge-config.interface';
import { AppConfig } from '../common';
import { WebbCurrencyId } from '../../enums';
import { InternalChainId } from '../../chains';
import { CurrencyRole } from '../../types/currency-config.interface';

export class Bridge {
  private constructor(private bridgeConfig: BridgeConfig, private readonly appConfig: AppConfig) {}

  static from(bridgeCurrency: WebbCurrencyId, appConfig: AppConfig): Bridge {
    console.log('WebbCurrencyId in Bridge static constructor: ', bridgeCurrency);
    const bridgeConfig = appConfig.bridgeByAsset[bridgeCurrency];
    return new Bridge(bridgeConfig, appConfig);
  }

  /*
   *  Get the bridge privy pools
   * */
  get anchors() {
    return this.bridgeConfig.anchors;
  }

  /*
   *  Get the bridge currency
   * */
  get currency() {
    return Currency.fromCurrencyId(this.appConfig.currencies, this.bridgeConfig.asset);
  }

  getTokenAddress(chainId: InternalChainId) {
    return this.appConfig.currencies[this.bridgeConfig.asset].addresses.get(chainId);
  }

  /*
   *  Get all Bridge tokens
   * */
  static getTokens(currenciesConfig: AppConfig['currencies']): Currency[] {
    const bridgeCurrenciesConfig = Object.values(currenciesConfig).filter((i) => i.role === CurrencyRole.Governable);
    return bridgeCurrenciesConfig.map((config) => {
      return Currency.fromCurrencyId(currenciesConfig, config.id);
    });
  }

  /*
   *  Get all Bridge tokens for a given chain
   * */
  static getTokensOfChain(currenciesConfig: AppConfig['currencies'], chainId: InternalChainId): Currency[] {
    const tokens = Bridge.getTokens(currenciesConfig);
    return tokens.filter((token) => token.hasChain(chainId));
  }
}
