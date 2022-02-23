// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

declare module '@polkadot/api/types/consts' {
  import type { ApiTypes, AugmentedConst, QueryableModuleConsts } from '@polkadot/api/types';
  import type { u32 } from '@polkadot/types';
  import type { FrameSupportPalletId } from '@polkadot/types/lookup';
  import type { Codec } from '@polkadot/types/types';

  export interface AugmentedConsts<ApiType  extends ApiTypes> {
    anchorBls381: {
      /**
       * Native currency id
       **/
      nativeCurrencyId: u32 & AugmentedConst<ApiType>;
      palletId: FrameSupportPalletId & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    anchorBn254: {
      /**
       * Native currency id
       **/
      nativeCurrencyId: u32 & AugmentedConst<ApiType>;
      palletId: FrameSupportPalletId & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    assetRegistry: {
      /**
       * Native Asset Id
       **/
      nativeAssetId: u32 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    mixerBls381: {
      /**
       * Native currency id
       **/
      nativeCurrencyId: u32 & AugmentedConst<ApiType>;
      palletId: FrameSupportPalletId & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    mixerBn254: {
      /**
       * Native currency id
       **/
      nativeCurrencyId: u32 & AugmentedConst<ApiType>;
      palletId: FrameSupportPalletId & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    tokens: {
      maxLocks: u32 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
  } // AugmentedConsts

  export interface QueryableConsts<ApiType extends ApiTypes> extends AugmentedConsts<ApiType> {
    [key: string]: QueryableModuleConsts;
  } // QueryableConsts

} // declare module
