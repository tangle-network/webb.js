// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

export default {
  rpc: {},
  types: {
    // primitives
    DarkwebbPrimitivesDepositDetails: {
      deposit: 'Balance',
      depositor: 'AccountId'
    },
    DarkwebbStandaloneRuntimeElement: '[u8;32]',
    Element: 'Vec<u8>',
    OrmlTokensAccountData: {
      free: 'Balance',
      frozen: 'Balance',
      reserved: 'Balance'
    },
    OrmlTokensBalanceLock: {
      balance: 'Balance',
      id: 'LockIdentifier'
    },
    PalletAnchorAnchorMetadata: {
      creator: 'AccountId',
      deposit_size: 'Balance'
    },
    PalletAnchorEdgeMetadata: {
      height: 'BlockNumber',
      root: 'Element',
      src_chain_id: 'ChainId'
    },
    PalletAnchorHandlerUpdateRecord: {
      edge_metadata: 'PalletAnchorEdgeMetadata',
      resource_id: 'ResourceId',
      tree_id: 'TreeId'
    },
    PalletAssetRegistryAssetDetails: {
      asset_type: 'PalletAssetRegistryAssetType',
      existential_deposit: 'Balance',
      locked: 'bool',
      name: 'Vec<u8>'
    },
    PalletAssetRegistryAssetMetadata: {
      decimals: 'u8',
      symbol: 'Vec<u8>'
    },
    PalletAssetRegistryAssetType: {
      _enum: ['Token', 'PoolShare']
    },
    PalletMixerMixerMetadata: {
      asset: 'AssetId',
      creator: 'AccountId',
      deposit_size: 'Balance'
    },
    ResourceId: '[u8; 32]'
  },
  typesAlias: {}
};
