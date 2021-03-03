// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Struct, bool } from '@polkadot/types';
import type { AccountId } from '@webb-tools/types/interfaces/runtime';

/** @name Manager */
export interface Manager extends Struct {
  readonly accountId: AccountId;
  readonly required: bool;
}

export type PHANTOM_MERKLE = 'merkle';
