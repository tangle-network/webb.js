// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AppConfig } from '@webb-tools/api-providers/abstracts/index.js';

import { Storage } from '../storage/index.js';
import { getEVMChainName } from './chain-utils.js';

export type MixerStorage = Record<string, { lastQueriedBlock: number; leaves: string[] }>;

export const evmChainStorageFactory = (config: AppConfig, chainId: number) => {
  // localStorage will have key: <name of chain>, value: { Record<contractAddress: string, info: DynamicMixerInfoStore> }
  return Storage.newFromCache<MixerStorage>(getEVMChainName(config, chainId), {
    async commit (key: string, data: MixerStorage): Promise<void> {
      localStorage.setItem(key, JSON.stringify(data));
    },
    async fetch (key: string): Promise<MixerStorage> {
      const storageCached = localStorage.getItem(key);

      if (storageCached) {
        return {
          ...JSON.parse(storageCached)
        };
      }

      return {};
    }
  });
};

export const anchorDeploymentBlock: Record<string, number> = {
  '0x09b722aa809a076027fa51902e431a8c03e3f8df': 9973527,
  '0x12323bcabb342096669d80f968f7a31bdb29d4c4': 23781159,
  '0x510c6297cc30a058f41eb4af1bfc9953ead8b577': 1,
  '0x6aa5c74953f7da1556a298c5e129e417410474e2': 6182601,
  '0x7758f98c1c487e5653795470eeab6c4698be541b': 1,
  '0x97747a4de7302ff7ee3334e33138879469bfecf8': 11795573,
  '0xc44a4ecac4f23b6f92485cb1c90dbed75a987bc8': 877902,
  '0xd8a8f9629a98eabff31cfa9493f274a4d5e768cd': 8301075
};

type BridgeStorage = Record<string, { lastQueriedBlock: number; leaves: string[] }>;

export const bridgeCurrencyBridgeStorageFactory = () => {
  // localStorage will have key: <Currency name>, value: { Record<contractAddress: string, info: DynamicMixerInfoStore> }
  return Storage.newFromCache<BridgeStorage>('webb-bridge', {
    async commit (key: string, data: BridgeStorage): Promise<void> {
      localStorage.setItem(key, JSON.stringify(data));
    },
    async fetch (key: string): Promise<BridgeStorage> {
      const storageCached = localStorage.getItem(key);

      if (storageCached) {
        return {
          ...JSON.parse(storageCached)
        };
      }

      return {};
    }
  });
};
