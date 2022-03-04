// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { U8aFixed, i128, u64 } from '@polkadot/types-codec';

/** @name Amount */
export interface Amount extends i128 {}

/** @name AmountOf */
export interface AmountOf extends Amount {}

/** @name CurrencyId */
export interface CurrencyId extends u64 {}

/** @name CurrencyIdOf */
export interface CurrencyIdOf extends CurrencyId {}

/** @name ScalarData */
export interface ScalarData extends U8aFixed {}

export type PHANTOM_MIXER = 'mixer';
