// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Codec } from '@polkadot/types/types';
import type { CurrencyIdOf } from '@webb-tools/types/interfaces/mixer';
import type { AccountId, BlockNumber, PalletId } from '@webb-tools/types/interfaces/runtime';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/consts' {
  export interface AugmentedConsts<ApiType> {
    mixer: {
      /**
       * Default admin key
       **/
      defaultAdmin: AccountId & AugmentedConst<ApiType>;
      /**
       * The small deposit length
       **/
      depositLength: BlockNumber & AugmentedConst<ApiType>;
      /**
       * Native currency id
       **/
      nativeCurrencyId: CurrencyIdOf & AugmentedConst<ApiType>;
      palletId: PalletId & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
  }

  export interface QueryableConsts<ApiType extends ApiTypes> extends AugmentedConsts<ApiType> {
    [key: string]: QueryableModuleConsts;
  }
}
