// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainType, computeChainIdType, EVMChainId } from '../chains/index.js';
import { Storage } from '../storage/index.js';

export type BridgeStorage = Record<string, { lastQueriedBlock: number; leaves: string[] }>;

export const anchorDeploymentBlock: Record<number, Record<string, number>> = {
  [computeChainIdType(ChainType.EVM, EVMChainId.Ropsten)]: {
    '0xc95ffc094b31789f5f1a6cbae071d7cc6e677d19': 12242400
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.Rinkeby)]: {
    '0xf2f7bc0bed36d94c19c337b6e114cad2bc218819': 10628940
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.Goerli)]: {
    '0x3e8b7e3b498ea9375172f4d4bd181c21f18a4381': 6840576
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.PolygonTestnet)]: {
    '0x3e8b7e3b498ea9375172f4d4bd181c21f18a4381': 26227363
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.OptimismTestnet)]: {
    '0xf2f7bc0bed36d94c19c337b6e114cad2bc218819': 2535400
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.ArbitrumTestnet)]: {
    '0x151bb411b44088a4615a1314b5a948272d8a0342': 11731661
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.HermesLocalnet)]: {
    '0xbfce6b877ebff977bb6e80b24fbbb7bc4ebca4df': 1
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.AthenaLocalnet)]: {
    '0x4e3df2073bf4b43b9944b8e5a463b1e185d6448c': 1
  }
};

export const getAnchorDeploymentBlockNumber = (chainIdType: number, contractAddress: string): number | undefined => {
  return Object.entries(anchorDeploymentBlock[chainIdType]).find((entry) => entry[0] === contractAddress.toLowerCase())?.[1];
};

// Expects the chainIdType
export const bridgeStorageFactory = (chainIdType: number) => {
  // localStorage will have key: <Currency name>, value: { Record<contractAddress: string, info: DynamicMixerInfoStore> }
  return Storage.newFromCache<BridgeStorage>(chainIdType.toString(), {
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
