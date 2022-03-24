import { AnchorBase, BridgeApi } from '../abstracts';
import { WebbPolkadot } from './webb-provider';
import { BridgeConfig } from '../types/bridge-config.interface';
import { Currency } from '@webb-tools/api-providers';
import { ChainTypeId } from '../chains';
import { CurrencyRole, CurrencyType } from '../types/currency-config.interface';

export class PolkadotBridgeApi extends BridgeApi<WebbPolkadot, BridgeConfig> {
  private get activeBridgeAsset() {
    return this.store.activeBridge?.asset ?? null;
  }

  getTokenAddress(chainId: ChainTypeId): string | null {
    return null;
  }

  async getCurrencies(): Promise<Currency[]> {
    const bridgeCurrenciesConfig = Object.values(this.inner.config.currencies).filter((i) => {
      const isValid = i.type === CurrencyType.ORML && i.role === CurrencyRole.Governable;
      // TODO : Validate whether the chain supports the token
      const isSupported = true;
      return isValid && isSupported;
    });
    return bridgeCurrenciesConfig.map((config) => {
      return Currency.fromCurrencyId(this.inner.config.currencies, config.id);
    });
  }

  get currency(): Currency | null {
    return this.activeBridgeAsset
      ? Currency.fromCurrencyId(this.inner.config.currencies, this.activeBridgeAsset)
      : null;
  }

  async getAnchors(): Promise<AnchorBase[]> {
    return (
      this.store.activeBridge?.anchors.map((anchor) => ({
        amount: anchor.amount,
        neighbours: anchor.anchorTreeIds
      })) ?? []
    );
  }

  async getWrappableAssets(chainId: ChainTypeId): Promise<Currency[]> {
    return [];
  }
}
