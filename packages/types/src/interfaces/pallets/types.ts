// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Bytes, Enum, Struct, U8aFixed, bool, u8 } from '@polkadot/types-codec';
import type { ChainId } from '@polkadot/types/interfaces/bridges';
import type { TreeId } from '@webb-tools/types/interfaces/merkle';
import type { AccountId, AssetId, Balance, BlockNumber, LockIdentifier } from '@webb-tools/types/interfaces/runtime';

/** @name DarkwebbPrimitivesDepositDetails */
export interface DarkwebbPrimitivesDepositDetails extends Struct {
  readonly depositor: AccountId;
  readonly deposit: Balance;
}

/** @name DarkwebbStandaloneRuntimeElement */
export interface DarkwebbStandaloneRuntimeElement extends U8aFixed {}

/** @name Element */
export interface Element extends Bytes {}

/** @name OrmlTokensAccountData */
export interface OrmlTokensAccountData extends Struct {
  readonly free: Balance;
  readonly frozen: Balance;
  readonly reserved: Balance;
}

/** @name OrmlTokensBalanceLock */
export interface OrmlTokensBalanceLock extends Struct {
  readonly id: LockIdentifier;
  readonly balance: Balance;
}

/** @name PalletAnchorAnchorMetadata */
export interface PalletAnchorAnchorMetadata extends Struct {
  readonly creator: AccountId;
  readonly deposit_size: Balance;
}

/** @name PalletAnchorEdgeMetadata */
export interface PalletAnchorEdgeMetadata extends Struct {
  readonly src_chain_id: ChainId;
  readonly root: Element;
  readonly height: BlockNumber;
}

/** @name PalletAnchorHandlerUpdateRecord */
export interface PalletAnchorHandlerUpdateRecord extends Struct {
  readonly tree_id: TreeId;
  readonly resource_id: ResourceId;
  readonly edge_metadata: PalletAnchorEdgeMetadata;
}

/** @name PalletAssetRegistryAssetDetails */
export interface PalletAssetRegistryAssetDetails extends Struct {
  readonly name: Bytes;
  readonly asset_type: PalletAssetRegistryAssetType;
  readonly existential_deposit: Balance;
  readonly locked: bool;
}

/** @name PalletAssetRegistryAssetMetadata */
export interface PalletAssetRegistryAssetMetadata extends Struct {
  readonly symbol: Bytes;
  readonly decimals: u8;
}

/** @name PalletAssetRegistryAssetType */
export interface PalletAssetRegistryAssetType extends Enum {
  readonly isToken: boolean;
  readonly isPoolShare: boolean;
  readonly type: 'Token' | 'PoolShare';
}

/** @name PalletMixerMixerMetadata */
export interface PalletMixerMixerMetadata extends Struct {
  readonly creator: AccountId;
  readonly deposit_size: Balance;
  readonly asset: AssetId;
}

/** @name ResourceId */
export interface ResourceId extends U8aFixed {}

export type PHANTOM_PALLETS = 'pallets';
