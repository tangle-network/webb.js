// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Data, Option, Vec, bool } from '@polkadot/types';
import type { AnyNumber, ITuple, Observable } from '@polkadot/types/types';
import type { GroupId, GroupTree, MixerInfo } from '@webb-tools/types/interfaces/mixer';
import type { BlockNumber } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/storage' {
  export interface AugmentedQueries<ApiType> {
    merkle: {
      [key: string]: QueryableStorageEntry<ApiType>;
      /**
       * Map of cached/past merkle roots at each blocknumber and group. There can be more than one root update in a single block.
       * Allows for easy pruning since we can remove all keys of first map past a certain point.
       **/
      cachedRoots: AugmentedQueryDoubleMap<
        ApiType,
        (key1: BlockNumber | AnyNumber | Uint8Array, key2: GroupId | AnyNumber | Uint8Array) => Observable<Vec<Data>>,
        [BlockNumber, GroupId]
      > &
        QueryableStorageEntry<ApiType, [BlockNumber, GroupId]>;
      /**
       * The map of groups to their metadata
       **/
      groups: AugmentedQuery<
        ApiType,
        (arg: GroupId | AnyNumber | Uint8Array) => Observable<Option<GroupTree>>,
        [GroupId]
      > &
        QueryableStorageEntry<ApiType, [GroupId]>;
      highestCachedBlock: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []> &
        QueryableStorageEntry<ApiType, []>;
      lowestCachedBlock: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []> &
        QueryableStorageEntry<ApiType, []>;
      /**
       * The next group identifier up for grabs
       **/
      nextGroupId: AugmentedQuery<ApiType, () => Observable<GroupId>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Map of used nullifiers (Data) for each tree.
       **/
      usedNullifiers: AugmentedQuery<
        ApiType,
        (
          arg:
            | ITuple<[GroupId, Data]>
            | [
                GroupId | AnyNumber | Uint8Array,
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
              ]
        ) => Observable<bool>,
        [ITuple<[GroupId, Data]>]
      > &
        QueryableStorageEntry<ApiType, [ITuple<[GroupId, Data]>]>;
    };
    mixer: {
      [key: string]: QueryableStorageEntry<ApiType>;
      initialised: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The vec of group ids
       **/
      mixerGroupIds: AugmentedQuery<ApiType, () => Observable<Vec<GroupId>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The map of mixer groups to their metadata
       **/
      mixerGroups: AugmentedQuery<
        ApiType,
        (arg: GroupId | AnyNumber | Uint8Array) => Observable<MixerInfo>,
        [GroupId]
      > &
        QueryableStorageEntry<ApiType, [GroupId]>;
    };
  }

  export interface QueryableStorage<ApiType extends ApiTypes> extends AugmentedQueries<ApiType> {
    [key: string]: QueryableModuleStorage<ApiType>;
  }
}
