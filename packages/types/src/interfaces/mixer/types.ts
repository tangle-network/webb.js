// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Data, Struct, Vec, bool, u32 } from '@polkadot/types';
import type { AccountId, Balance, BlockNumber } from '@webb-tools/types/interfaces/runtime';

/** @name Commitment */
export interface Commitment extends Data {}

/** @name GroupId */
export interface GroupId extends u32 {}

/** @name GroupTree */
export interface GroupTree extends Struct {
  readonly manager: AccountId;
  readonly manager_required: bool;
  readonly leaf_count: u32;
  readonly max_leaves: u32;
  readonly root_hash: Data;
  readonly edge_nodes: Vec<Data>;
}

/** @name MixerInfo */
export interface MixerInfo extends Struct {
  readonly minimum_deposit_length_for_reward: BlockNumber;
  readonly fixed_deposit_size: Balance;
  readonly leaves: Vec<Data>;
}

/** @name Nullifier */
export interface Nullifier extends Data {}

export type PHANTOM_MIXER = 'mixer';
