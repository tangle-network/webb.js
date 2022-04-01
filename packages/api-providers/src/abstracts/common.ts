// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AnchorConfigEntry } from '../types/anchor-config.interface.js';
import { BridgeConfig } from '../types/bridge-config.interface.js';
import { ChainConfig } from '../types/chain-config.interface.js';
import { CurrencyConfig } from '../types/currency-config.interface.js';
import { MixerConfig } from '../types/mixer-config.interface.js';
import { WalletConfig } from '../types/wallet-config.interface.js';

export type Chain = ChainConfig & {
  wallets: Record<number, Wallet>;
};
export type Wallet = WalletConfig;

export type AppConfig = {
  wallet: Record<number, WalletConfig>;
  chains: Record<number, ChainConfig>;
  currencies: Record<number, CurrencyConfig>;
  bridgeByAsset: Record<number, BridgeConfig>;
  anchors: Record<number, AnchorConfigEntry[]>;
  mixers: Record<number, MixerConfig>;
};
