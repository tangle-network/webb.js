// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Bytes, Enum, Option, Struct, U8aFixed, Vec, bool, i128, u64, u8 } from '@polkadot/types';
import type { ChainId } from '@polkadot/types/interfaces/bridges';
import type { TreeId } from '@webb-tools/types/interfaces/merkle';
import type { AccountId, AssetId, Balance, BlockNumber } from '@webb-tools/types/interfaces/runtime';

/** @name Amount */
export interface Amount extends i128 {}

/** @name AmountOf */
export interface AmountOf extends Amount {}

/** @name Commitment */
export interface Commitment extends ScalarData {}

/** @name CurrencyId */
export interface CurrencyId extends u64 {}

/** @name CurrencyIdOf */
export interface CurrencyIdOf extends CurrencyId {}

/** @name DarkwebbPrimitivesDepositDetails */
export interface DarkwebbPrimitivesDepositDetails extends Struct {
  readonly depositor: AccountId;
  readonly deposit: Balance;
}

/** @name Element */
export interface Element extends Bytes {}

/** @name MixerInfo */
export interface MixerInfo extends Struct {
  readonly minimum_deposit_length_for_reward: BlockNumber;
  readonly fixed_deposit_size: Balance;
  readonly currency_id: CurrencyIdOf;
}

/** @name NodeTemplateRuntimeElement */
export interface NodeTemplateRuntimeElement extends Bytes {}

/** @name Nullifier */
export interface Nullifier extends ScalarData {}

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
}

/** @name PalletMixerMixerMetadata */
export interface PalletMixerMixerMetadata extends Struct {
  readonly creator: AccountId;
  readonly deposit_size: Balance;
  readonly asset: AssetId;
}

/** @name ResourceId */
export interface ResourceId extends U8aFixed {}

/** @name ScalarData */
export interface ScalarData extends U8aFixed {}

/** @name WithdrawProof */
export interface WithdrawProof extends Struct {
  readonly mixer_id: TreeId;
  readonly cached_block: BlockNumber;
  readonly cached_root: ScalarData;
  readonly comms: Vec<Commitment>;
  readonly nullifier_hash: ScalarData;
  readonly proof_bytes: Bytes;
  readonly leaf_index_commitments: Vec<Commitment>;
  readonly proof_commitments: Vec<Commitment>;
  readonly recipient: Option<AccountId>;
  readonly relayer: Option<AccountId>;
}

export type PHANTOM_MIXER = 'mixer';
