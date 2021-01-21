// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Bytes, Data, Vec } from '@polkadot/types';
import type { AnyNumber, ITuple } from '@polkadot/types/types';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { Commitment, GroupId } from '@webb-tools/types/interfaces/mixer';
import type { BlockNumber, Call } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    mixer: {
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
      deposit: AugmentedSubmittable<(mixerId: GroupId | AnyNumber | Uint8Array, dataPoints: Vec<Data> | (Data | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [GroupId, Vec<Data>]>;
      initialize: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      withdraw: AugmentedSubmittable<(mixerId: GroupId | AnyNumber | Uint8Array, cachedBlock: BlockNumber | AnyNumber | Uint8Array, cachedRoot: Data | string | Uint8Array, leafCom: Commitment | string | Uint8Array, path: Vec<ITuple<[Commitment, Commitment]>> | ([Commitment | string | Uint8Array, Commitment | string | Uint8Array])[], rCom: Commitment | string | Uint8Array, nullifierCom: Commitment | string | Uint8Array, nullifierHash: Data | string | Uint8Array, proofBytes: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [GroupId, BlockNumber, Data, Commitment, Vec<ITuple<[Commitment, Commitment]>>, Commitment, Commitment, Data, Bytes]>;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
    [key: string]: SubmittableModuleExtrinsics<ApiType>;
  }
}
