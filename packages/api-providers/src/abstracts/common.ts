// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { AnchorConfigEntry } from '../types/anchor-config.interface';
import { BridgeConfig } from '../types/bridge-config.interface';
import { ChainConfig } from '../types/chain-config.interface';
import { CurrencyConfig } from '../types/currency-config.interface';
import { MixerConfig } from '../types/mixer-config.interface';
import { WalletConfig } from '../types/wallet-config.interface';

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