// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainType, computeChainIdType, EVMChainId } from '../chains/index.js';
import { Storage } from '../storage/index.js';

export type BridgeStorage = Record<string, { lastQueriedBlock: number; leaves: string[] }>;

export const anchorDeploymentBlock: Record<number, Record<string, number>> = {
  [computeChainIdType(ChainType.EVM, EVMChainId.Ropsten)]: {
    '0x09d2D6520BE3922549c81885477258F41c96c43f': 12253337
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.Rinkeby)]: {
    '0x95E2eB4c9Fe2FB580E27dCe997e0E3D69FFdDf5a': 10651758
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.Goerli)]: {
    '0x6188F18359250f241e2171BAFD57447F8931176e': 6859976
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.PolygonTestnet)]: {
    '0x95E2eB4c9Fe2FB580E27dCe997e0E3D69FFdDf5a': 26274943
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.OptimismTestnet)]: {
    '0x27a693cdF40acFc18195C2ecc9f0352452624e84': 2664708
  },
  [computeChainIdType(ChainType.EVM, EVMChainId.ArbitrumTestnet)]: {
    '0x30aEF9a80BAe60Cd789904C8875fbd6a19b80488': 11799624
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
