// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Struct, Vec, bool, u32, u8 } from '@polkadot/types';
import type { ScalarData } from '@webb-tools/types/interfaces/mixer';
import type { AccountId } from '@webb-tools/types/interfaces/runtime';

/** @name GroupId */
export interface GroupId extends u32 {}

/** @name GroupTree */
export interface GroupTree extends Struct {
  readonly leaf_count: u32;
  readonly max_leaves: u32;
  readonly depth: u8;
  readonly root_hash: ScalarData;
  readonly edge_nodes: Vec<ScalarData>;
}

/** @name Manager */
export interface Manager extends Struct {
  readonly accountId: AccountId;
  readonly required: bool;
}

export type PHANTOM_MERKLE = 'merkle';
