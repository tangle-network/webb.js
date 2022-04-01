// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { Currency } from '@webb-tools/api-providers/index.js';

import { AnchorApi, AnchorBase } from '../abstracts/index.js';
import { ChainTypeId } from '../chains/index.js';
import { BridgeConfig } from '../types/bridge-config.interface.js';
import { CurrencyRole, CurrencyType } from '../types/currency-config.interface.js';
import { WebbPolkadot } from './webb-provider.js';

export class PolkadotAnchorApi extends AnchorApi<WebbPolkadot, BridgeConfig> {
  private get activeBridgeAsset () {
    return this.store.activeBridge?.asset ?? null;
  }

  getTokenAddress (chainId: ChainTypeId): string | null {
    return null;
  }

  async getCurrencies (): Promise<Currency[]> {
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

  get currency (): Currency | null {
    return this.activeBridgeAsset
      ? Currency.fromCurrencyId(this.inner.config.currencies, this.activeBridgeAsset)
      : null;
  }

  async getAnchors (): Promise<AnchorBase[]> {
    return (
      this.store.activeBridge?.anchors.map((anchor) => ({
        amount: anchor.amount,
        neighbours: anchor.anchorTreeIds
      })) ?? []
    );
  }

  async getWrappableAssets (chainId: ChainTypeId): Promise<Currency[]> {
    return [];
  }
}
