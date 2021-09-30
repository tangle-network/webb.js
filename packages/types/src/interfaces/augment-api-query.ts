// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api/types';
import type { Option, bool, u32 } from '@polkadot/types';
import type { AnyNumber, Observable } from '@polkadot/types/types';
import type { AccountId32 } from '@webb-tools/types/interfaces/runtime';

declare module '@polkadot/api/types/storage' {
  export interface AugmentedQueries<ApiType> {
    mixer: {
      /**
       * The parameter maintainer who can change the parameters
       **/
      maintainer: AugmentedQuery<ApiType, () => Observable<AccountId32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The map of trees to their mixer metadata
       **/
      mixers: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletMixerMixerMetadata>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * The map of trees to their spent nullifier hashes
       **/
      nullifierHashes: AugmentedQuery<ApiType, (arg1: u32 | AnyNumber | Uint8Array, arg2: NodeTemplateRuntimeElement | string | Uint8Array) => Observable<bool>, [u32, NodeTemplateRuntimeElement]> & QueryableStorageEntry<ApiType, [u32, NodeTemplateRuntimeElement]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
  }

  export interface QueryableStorage<ApiType extends ApiTypes> extends AugmentedQueries<ApiType> {
    [key: string]: QueryableModuleStorage<ApiType>;
  }
}
