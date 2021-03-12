// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Bytes, Option, Vec, bool, u8 } from '@polkadot/types';
import type { AnyNumber, ITuple } from '@polkadot/types/types';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { GroupId } from '@webb-tools/types/interfaces/merkle';
import type { Commitment, ScalarData } from '@webb-tools/types/interfaces/mixer';
import type { AccountId, BlockNumber, Call } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    merkle: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      addMembers: AugmentedSubmittable<(groupId: GroupId | AnyNumber | Uint8Array, members: Vec<ScalarData> | (ScalarData | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [GroupId, Vec<ScalarData>]>;
      createGroup: AugmentedSubmittable<(rIsMgr: bool | boolean | Uint8Array, depth: Option<u8> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [bool, Option<u8>]>;
      setManager: AugmentedSubmittable<(groupId: GroupId | AnyNumber | Uint8Array, newManager: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [GroupId, AccountId]>;
      setManagerRequired: AugmentedSubmittable<(groupId: GroupId | AnyNumber | Uint8Array, managerRequired: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [GroupId, bool]>;
      setStopped: AugmentedSubmittable<(groupId: GroupId | AnyNumber | Uint8Array, stopped: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [GroupId, bool]>;
      /**
       * Verification stub for testing, these verification functions should
       * not need to be used directly as extrinsics. Rather, higher-order
       * modules should use the module functions to verify and execute
       * further logic.
       **/
      verify: AugmentedSubmittable<(groupId: GroupId | AnyNumber | Uint8Array, leaf: ScalarData | string | Uint8Array, path: Vec<ITuple<[bool, ScalarData]>> | ([bool | boolean | Uint8Array, ScalarData | string | Uint8Array])[]) => SubmittableExtrinsic<ApiType>, [GroupId, ScalarData, Vec<ITuple<[bool, ScalarData]>>]>;
    };
    mixer: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      deposit: AugmentedSubmittable<(mixerId: GroupId | AnyNumber | Uint8Array, dataPoints: Vec<ScalarData> | (ScalarData | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [GroupId, Vec<ScalarData>]>;
      setStopped: AugmentedSubmittable<(stopped: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [bool]>;
      transferAdmin: AugmentedSubmittable<(to: AccountId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId]>;
      withdraw: AugmentedSubmittable<(mixerId: GroupId | AnyNumber | Uint8Array, cachedBlock: BlockNumber | AnyNumber | Uint8Array, cachedRoot: ScalarData | string | Uint8Array, comms: Vec<Commitment> | (Commitment | string | Uint8Array)[], nullifierHash: ScalarData | string | Uint8Array, proofBytes: Bytes | string | Uint8Array, leafIndexCommitments: Vec<Commitment> | (Commitment | string | Uint8Array)[], proofCommitments: Vec<Commitment> | (Commitment | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [GroupId, BlockNumber, ScalarData, Vec<Commitment>, ScalarData, Bytes, Vec<Commitment>, Vec<Commitment>]>;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
    [key: string]: SubmittableModuleExtrinsics<ApiType>;
  }
}
