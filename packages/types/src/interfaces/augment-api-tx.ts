// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Bytes, Data, Option, Vec, bool, u8 } from '@polkadot/types';
import type { AnyNumber, ITuple } from '@polkadot/types/types';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { Commitment, GroupId } from '@webb-tools/types/interfaces/mixer';
import type { AccountId, BlockNumber, Call } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    merkle: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      addMembers: AugmentedSubmittable<
        (
          groupId: GroupId | AnyNumber | Uint8Array,
          members:
            | Vec<Data>
            | (
                | Data
                | { None: any }
                | { Raw: any }
                | { BlakeTwo256: any }
                | { Sha256: any }
                | { Keccak256: any }
                | { ShaThree256: any }
                | string
                | Uint8Array
              )[]
        ) => SubmittableExtrinsic<ApiType>,
        [GroupId, Vec<Data>]
      >;
      createGroup: AugmentedSubmittable<
        (
          rIsMgr: bool | boolean | Uint8Array,
          depth: Option<u8> | null | object | string | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [bool, Option<u8>]
      >;
      forceSetManager: AugmentedSubmittable<
        (
          groupId: GroupId | AnyNumber | Uint8Array,
          newManager: AccountId | string | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [GroupId, AccountId]
      >;
      setManager: AugmentedSubmittable<
        (
          groupId: GroupId | AnyNumber | Uint8Array,
          newManager: AccountId | string | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [GroupId, AccountId]
      >;
      setManagerRequired: AugmentedSubmittable<
        (
          groupId: GroupId | AnyNumber | Uint8Array,
          managerRequired: bool | boolean | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [GroupId, bool]
      >;
      /**
       * Verification stub for testing, these verification functions should
       * not need to be used directly as extrinsics. Rather, higher-order
       * modules should use the module functions to verify and execute further
       * logic.
       **/
      verify: AugmentedSubmittable<
        (
          groupId: GroupId | AnyNumber | Uint8Array,
          leaf:
            | Data
            | { None: any }
            | { Raw: any }
            | { BlakeTwo256: any }
            | { Sha256: any }
            | { Keccak256: any }
            | { ShaThree256: any }
            | string
            | Uint8Array,
          path:
            | Vec<ITuple<[bool, Data]>>
            | [
                bool | boolean | Uint8Array,
                (
                  | Data
                  | { None: any }
                  | { Raw: any }
                  | { BlakeTwo256: any }
                  | { Sha256: any }
                  | { Keccak256: any }
                  | { ShaThree256: any }
                  | string
                  | Uint8Array
                )
              ][]
        ) => SubmittableExtrinsic<ApiType>,
        [GroupId, Data, Vec<ITuple<[bool, Data]>>]
      >;
    };
    mixer: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      deposit: AugmentedSubmittable<
        (
          mixerId: GroupId | AnyNumber | Uint8Array,
          dataPoints:
            | Vec<Data>
            | (
                | Data
                | { None: any }
                | { Raw: any }
                | { BlakeTwo256: any }
                | { Sha256: any }
                | { Keccak256: any }
                | { ShaThree256: any }
                | string
                | Uint8Array
              )[]
        ) => SubmittableExtrinsic<ApiType>,
        [GroupId, Vec<Data>]
      >;
      initialize: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      withdraw: AugmentedSubmittable<
        (
          mixerId: GroupId | AnyNumber | Uint8Array,
          cachedBlock: BlockNumber | AnyNumber | Uint8Array,
          cachedRoot:
            | Data
            | { None: any }
            | { Raw: any }
            | { BlakeTwo256: any }
            | { Sha256: any }
            | { Keccak256: any }
            | { ShaThree256: any }
            | string
            | Uint8Array,
          leafCom:
            | Commitment
            | { None: any }
            | { Raw: any }
            | { BlakeTwo256: any }
            | { Sha256: any }
            | { Keccak256: any }
            | { ShaThree256: any }
            | string
            | Uint8Array,
          path:
            | Vec<ITuple<[Commitment, Commitment]>>
            | [
                (
                  | Commitment
                  | { None: any }
                  | { Raw: any }
                  | { BlakeTwo256: any }
                  | { Sha256: any }
                  | { Keccak256: any }
                  | { ShaThree256: any }
                  | string
                  | Uint8Array
                ),
                (
                  | Commitment
                  | { None: any }
                  | { Raw: any }
                  | { BlakeTwo256: any }
                  | { Sha256: any }
                  | { Keccak256: any }
                  | { ShaThree256: any }
                  | string
                  | Uint8Array
                )
              ][],
          rCom:
            | Commitment
            | { None: any }
            | { Raw: any }
            | { BlakeTwo256: any }
            | { Sha256: any }
            | { Keccak256: any }
            | { ShaThree256: any }
            | string
            | Uint8Array,
          nullifierCom:
            | Commitment
            | { None: any }
            | { Raw: any }
            | { BlakeTwo256: any }
            | { Sha256: any }
            | { Keccak256: any }
            | { ShaThree256: any }
            | string
            | Uint8Array,
          nullifierHash:
            | Data
            | { None: any }
            | { Raw: any }
            | { BlakeTwo256: any }
            | { Sha256: any }
            | { Keccak256: any }
            | { ShaThree256: any }
            | string
            | Uint8Array,
          proofBytes: Bytes | string | Uint8Array
        ) => SubmittableExtrinsic<ApiType>,
        [
          GroupId,
          BlockNumber,
          Data,
          Commitment,
          Vec<ITuple<[Commitment, Commitment]>>,
          Commitment,
          Commitment,
          Data,
          Bytes
        ]
      >;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
    [key: string]: SubmittableModuleExtrinsics<ApiType>;
  }
}
