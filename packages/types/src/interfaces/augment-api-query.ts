// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Option, Vec, bool } from '@polkadot/types';
import type { AnyNumber, ITuple, Observable } from '@polkadot/types/types';
import type { Manager } from '@webb-tools/types/interfaces/merkle';
import type { GroupId, GroupTree, MixerInfo, ScalarData } from '@webb-tools/types/interfaces/mixer';
import type { AccountId, BalanceOf, BlockNumber } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/storage' {
  export interface AugmentedQueries<ApiType> {
    merkle: {
      [key: string]: QueryableStorageEntry<ApiType>;
      /**
       * Map of cached/past merkle roots at each blocknumber and group. There can
       * be more than one root update in a single block. Allows for easy pruning
       * since we can remove all keys of first map past a certain point.
       **/
      cachedRoots: AugmentedQueryDoubleMap<ApiType, (key1: BlockNumber | AnyNumber | Uint8Array, key2: GroupId | AnyNumber | Uint8Array) => Observable<Vec<ScalarData>>, [BlockNumber, GroupId]> & QueryableStorageEntry<ApiType, [BlockNumber, GroupId]>;
      /**
       * The map of groups to their metadata
       **/
      groups: AugmentedQuery<ApiType, (arg: GroupId | AnyNumber | Uint8Array) => Observable<Option<GroupTree>>, [GroupId]> & QueryableStorageEntry<ApiType, [GroupId]>;
      highestCachedBlock: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []> & QueryableStorageEntry<ApiType, []>;
      lowestCachedBlock: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []> & QueryableStorageEntry<ApiType, []>;
      managers: AugmentedQuery<ApiType, (arg: GroupId | AnyNumber | Uint8Array) => Observable<Option<Manager>>, [GroupId]> & QueryableStorageEntry<ApiType, [GroupId]>;
      /**
       * Old name generated by `decl_event`.
       * The next group identifier up for grabs
       **/
      nextGroupId: AugmentedQuery<ApiType, () => Observable<GroupId>, []> & QueryableStorageEntry<ApiType, []>;
      stopped: AugmentedQuery<ApiType, (arg: GroupId | AnyNumber | Uint8Array) => Observable<bool>, [GroupId]> & QueryableStorageEntry<ApiType, [GroupId]>;
      /**
       * Map of used nullifiers (Data) for each tree.
       **/
      usedNullifiers: AugmentedQuery<ApiType, (arg: ITuple<[GroupId, ScalarData]> | [GroupId | AnyNumber | Uint8Array, ScalarData | string | Uint8Array]) => Observable<bool>, [ITuple<[GroupId, ScalarData]>]> & QueryableStorageEntry<ApiType, [ITuple<[GroupId, ScalarData]>]>;
    };
    mixer: {
      [key: string]: QueryableStorageEntry<ApiType>;
      /**
       * Administrator of the mixer pallet.
       * This account that can stop/start operations of the mixer
       **/
      admin: AugmentedQuery<ApiType, () => Observable<AccountId>, []> & QueryableStorageEntry<ApiType, []>;
      initialised: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The vec of group ids
       **/
      mixerGroupIds: AugmentedQuery<ApiType, () => Observable<Vec<GroupId>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The map of mixer groups to their metadata
       **/
      mixerGroups: AugmentedQuery<ApiType, (arg: GroupId | AnyNumber | Uint8Array) => Observable<MixerInfo>, [GroupId]> & QueryableStorageEntry<ApiType, [GroupId]>;
      /**
       * The TVL per group
       **/
      totalValueLocked: AugmentedQuery<ApiType, (arg: GroupId | AnyNumber | Uint8Array) => Observable<BalanceOf>, [GroupId]> & QueryableStorageEntry<ApiType, [GroupId]>;
    };
  }

  export interface QueryableStorage<ApiType extends ApiTypes> extends AugmentedQueries<ApiType> {
    [key: string]: QueryableModuleStorage<ApiType>;
  }
}
