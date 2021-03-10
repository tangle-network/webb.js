// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Bytes, Enum, Option, Struct, U8aFixed, Vec } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import type { GroupId } from '@webb-tools/types/interfaces/merkle';
import type { AccountId, Balance, BlockNumber, H160 } from '@webb-tools/types/interfaces/runtime';

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
}

/** @name WithdrawProof */
export interface WithdrawProof extends Struct {
  readonly mixer_id: GroupId;
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
