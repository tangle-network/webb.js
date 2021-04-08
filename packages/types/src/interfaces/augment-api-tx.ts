// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Option, Vec, bool, u8 } from '@polkadot/types';
import type { AnyNumber, ITuple } from '@polkadot/types/types';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { TreeId } from '@webb-tools/types/interfaces/merkle';
import type { CurrencyIdOf, ScalarData, WithdrawProof } from '@webb-tools/types/interfaces/mixer';
import type { AccountId, BalanceOf, Call } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    merkle: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      /**
       * Adds an array of leaf data into the tree and adds calculated root to
       * the cache.
       *
       * Can only be called by the manager if a manager is set.
       *
       * Weights:
       * - Dependent on argument: `members`
       *
       * - Base weight: 384_629_956_000
       * - DB weights: 3 reads, 2 writes
       * - Additional weights: 20_135_984_000 * members.len()
       **/
      addMembers: AugmentedSubmittable<
        (
          treeId: TreeId | AnyNumber | Uint8Array,
          members: Vec<ScalarData> | (ScalarData | string | Uint8Array)[]
        ) => SubmittableExtrinsic<ApiType>,
        [TreeId, Vec<ScalarData>]
      >;
      /**
       * Creates a new tree and sets a new manager for that tree. The
       * initial manager is the sender. Also increments the mixer id counter
       * in the storage. If _depth is not provided, max tree depth is
       * assumed.
       *
       * Weights:
       * - Dependent on arguments: _depth
       *
       * - Base weight: 8_356_000
       * - DB weights: 1 read, 3 writes
       * - Additional weights: 151_000 * _depth
       **/
      createTree: AugmentedSubmittable<
        (
          rIsMgr: bool | boolean | Uint8Array,
          depth: Option<u8> | null | object | string | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [bool, Option<u8>]
      >;
      /**
       * Sets manager account id.
       *
       * Can only be called by the root or the current manager.
       *
       * Weights:
       * - Independent of the arguments.
       *
       * - Base weight: 8_000_000
       * - DB weights: 1 read, 1 write
       **/
      setManager: AugmentedSubmittable<
        (
          treeId: TreeId | AnyNumber | Uint8Array,
          newManager: AccountId | string | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [TreeId, AccountId]
      >;
      /**
       * Sets if a manager is required for specific actions like adding
       * nullifiers or leaves into the tree.
       *
       * Can only be called by the root or the current manager.
       *
       * Weights:
       * - Independend of the arguments.
       *
       * - Base weight: 7_000_000
       * - DB weights: 1 read, 1 write
       **/
      setManagerRequired: AugmentedSubmittable<
        (
          treeId: TreeId | AnyNumber | Uint8Array,
          managerRequired: bool | boolean | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [TreeId, bool]
      >;
      /**
       * Set stopped flag inside the storage.
       *
       * Can only be called by the root or the current manager.
       *
       * Weights:
       * - Independent of the arguments.
       *
       * - Base weight: 8_000_000
       * - DB weights: 1 read, 1 write
       **/
      setStopped: AugmentedSubmittable<
        (
          treeId: TreeId | AnyNumber | Uint8Array,
          stopped: bool | boolean | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [TreeId, bool]
      >;
      /**
       * Verification stub for testing, these verification functions should
       * not need to be used directly as extrinsics. Rather, higher-order
       * modules should use the module functions to verify and execute
       * further logic.
       *
       * Verifies the membership proof.
       *
       * Weights:
       * - Dependent on the argument: `path`
       * - Base weight: 383_420_867_000
       * - DB weights: 1 read
       * - Additional weights: 814_291_000 * path.len()
       **/
      verify: AugmentedSubmittable<
        (
          treeId: TreeId | AnyNumber | Uint8Array,
          leaf: ScalarData | string | Uint8Array,
          path: Vec<ITuple<[bool, ScalarData]>> | [bool | boolean | Uint8Array, ScalarData | string | Uint8Array][]
        ) => SubmittableExtrinsic<ApiType>,
        [TreeId, ScalarData, Vec<ITuple<[bool, ScalarData]>>]
      >;
    };
    mixer: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      createNew: AugmentedSubmittable<
        (
          currencyId: CurrencyIdOf | AnyNumber | Uint8Array,
          size: BalanceOf | AnyNumber | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [CurrencyIdOf, BalanceOf]
      >;
      /**
       * Deposits the fixed amount into the mixer with id of `mixer_id`
       * Multiple deposits can be inserted together since `data_points` is an
       * array.
       *
       * Fails in case the mixer is stopped or not initialized.
       *
       * Weights:
       * - Dependent on argument: `data_points`
       *
       * - Base weight: 417_168_400_000
       * - DB weights: 8 reads, 5 writes
       * - Additional weights: 21_400_442_000 * data_points.len()
       **/
      deposit: AugmentedSubmittable<
        (
          mixerId: TreeId | AnyNumber | Uint8Array,
          dataPoints: Vec<ScalarData> | (ScalarData | string | Uint8Array)[]
        ) => SubmittableExtrinsic<ApiType>,
        [TreeId, Vec<ScalarData>]
      >;
      /**
       * Stops the operation of all the mixers managed by the pallet.
       * Can only be called by the admin or the root origin.
       *
       * Weights:
       * - Independent of the arguments.
       *
       * - Base weight: 36_000_000
       * - DB weights: 6 reads, 4 writes
       **/
      setStopped: AugmentedSubmittable<(stopped: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [bool]>;
      /**
       * Transfers the admin from the caller to the specified `to` account.
       * Can only be called by the current admin or the root origin.
       *
       * Weights:
       * - Independent of the arguments.
       *
       * - Base weight: 7_000_000
       * - DB weights: 1 read, 1 write
       **/
      transferAdmin: AugmentedSubmittable<
        (to: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>,
        [AccountId]
      >;
      /**
       * Withdraws a deposited amount from the mixer. Can only withdraw one
       * deposit. Accepts proof of membership along with the mixer id.
       *
       * Fails if the mixer is stopped or not initialized.
       *
       * Weights:
       * - Independent of the arguments.
       *
       * - Base weight: 1_078_562_000_000
       * - DB weights: 9 reads, 3 writes
       **/
      withdraw: AugmentedSubmittable<
        (
          withdrawProof:
            | WithdrawProof
            | {
                mixer_id?: any;
                cached_block?: any;
                cached_root?: any;
                comms?: any;
                nullifier_hash?: any;
                proof_bytes?: any;
                leaf_index_commitments?: any;
                proof_commitments?: any;
                recipient?: any;
                relayer?: any;
              }
            | string
            | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [WithdrawProof]
      >;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
    [key: string]: SubmittableModuleExtrinsics<ApiType>;
  }
}
