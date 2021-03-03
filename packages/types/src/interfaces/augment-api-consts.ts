// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { u8 } from '@polkadot/types';
import type { Codec } from '@polkadot/types/types';
import type { AccountId, BlockNumber, ModuleId } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/consts' {
  export interface AugmentedConsts<ApiType> {
    mixer: {
      [key: string]: Codec;
      /**
       * Default admin key
       **/
      defaultAdmin: AccountId & AugmentedConst<ApiType>;
      /**
       * The small deposit length
       **/
      depositLength: BlockNumber & AugmentedConst<ApiType>;
      /**
       * The max depth of the mixers
       **/
      maxMixerTreeDepth: u8 & AugmentedConst<ApiType>;
      moduleId: ModuleId & AugmentedConst<ApiType>;
    };
  }

  export interface QueryableConsts<ApiType extends ApiTypes> extends AugmentedConsts<ApiType> {
    [key: string]: QueryableModuleConsts;
  }
}
