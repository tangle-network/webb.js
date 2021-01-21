// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Vec, bool } from '@polkadot/types';
import type { AnyNumber, Observable } from '@polkadot/types/types';
import type { GroupId, MixerInfo } from '@webb-tools/types/interfaces/mixer';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/storage' {
  export interface AugmentedQueries<ApiType> {
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
      mixerGroups: AugmentedQuery<ApiType, (arg: GroupId | AnyNumber | Uint8Array) => Observable<MixerInfo>, [GroupId]> & QueryableStorageEntry<ApiType, [GroupId]>;
    };
  }

  export interface QueryableStorage<ApiType extends ApiTypes> extends AugmentedQueries<ApiType> {
    [key: string]: QueryableModuleStorage<ApiType>;
  }
}
