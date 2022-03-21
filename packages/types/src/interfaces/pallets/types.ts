// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Bytes, Enum, Struct, U8aFixed, bool, u8 } from '@polkadot/types-codec';
import type { ChainId } from '@polkadot/types/interfaces/bridges';
import type { TreeId } from '@webb-tools/types/interfaces/merkle';
import type { AccountId, AssetId, Balance, BlockNumber, LockIdentifier } from '@webb-tools/types/interfaces/runtime';

/** @name DarkwebbPrimitivesDepositDetails */
export interface DarkwebbPrimitivesDepositDetails extends Struct {
  readonly deposit: Balance;
  readonly depositor: AccountId;
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
  readonly balance: Balance;
  readonly id: LockIdentifier;
}

/** @name PalletAnchorAnchorMetadata */
export interface PalletAnchorAnchorMetadata extends Struct {
  readonly creator: AccountId;
  readonly deposit_size: Balance;
}

/** @name PalletAnchorEdgeMetadata */
export interface PalletAnchorEdgeMetadata extends Struct {
  readonly height: BlockNumber;
  readonly root: Element;
  readonly src_chain_id: ChainId;
}

/** @name PalletAnchorHandlerUpdateRecord */
export interface PalletAnchorHandlerUpdateRecord extends Struct {
  readonly edge_metadata: PalletAnchorEdgeMetadata;
  readonly resource_id: ResourceId;
  readonly tree_id: TreeId;
}

/** @name PalletAssetRegistryAssetDetails */
export interface PalletAssetRegistryAssetDetails extends Struct {
  readonly asset_type: PalletAssetRegistryAssetType;
  readonly existential_deposit: Balance;
  readonly locked: bool;
  readonly name: Bytes;
}

/** @name PalletAssetRegistryAssetMetadata */
export interface PalletAssetRegistryAssetMetadata extends Struct {
  readonly decimals: u8;
  readonly symbol: Bytes;
}

/** @name PalletAssetRegistryAssetType */
export interface PalletAssetRegistryAssetType extends Enum {
  readonly isToken: boolean;
  readonly isPoolShare: boolean;
  readonly type: 'Token' | 'PoolShare';
}

/** @name PalletMixerMixerMetadata */
export interface PalletMixerMixerMetadata extends Struct {
  readonly asset: AssetId;
  readonly creator: AccountId;
  readonly deposit_size: Balance;
}

/** @name ResourceId */
export interface ResourceId extends U8aFixed {}

export type PHANTOM_PALLETS = 'pallets';
