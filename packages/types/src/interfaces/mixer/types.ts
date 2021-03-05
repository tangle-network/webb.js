// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Enum, Struct, U8aFixed, Vec } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import type { Balance, BlockNumber, H160 } from '@webb-tools/types/interfaces/runtime';

/** @name Commitment */
export interface Commitment extends ScalarData {}

/** @name CurrencyId */
export interface CurrencyId extends Enum {
  readonly isToken: boolean;
  readonly asToken: TokenSymbol;
  readonly isDexShare: boolean;
  readonly asDexShare: ITuple<[TokenSymbol, TokenSymbol]>;
  readonly isErc20: boolean;
  readonly asErc20: EvmAddress;
}

/** @name EvmAddress */
export interface EvmAddress extends H160 {}

/** @name MixerInfo */
export interface MixerInfo extends Struct {
  readonly minimum_deposit_length_for_reward: BlockNumber;
  readonly fixed_deposit_size: Balance;
  readonly leaves: Vec<ScalarData>;
}

/** @name Nullifier */
export interface Nullifier extends ScalarData {}

/** @name ScalarData */
export interface ScalarData extends U8aFixed {}

/** @name TokenSymbol */
export interface TokenSymbol extends Enum {
  readonly isEdg: boolean;
  readonly isHedg: boolean;
  readonly isDot: boolean;
  readonly isKsm: boolean;
}

export type PHANTOM_MIXER = 'mixer';
