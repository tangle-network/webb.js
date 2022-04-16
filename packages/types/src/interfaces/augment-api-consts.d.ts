// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { u16, u32 } from '@polkadot/types-codec';
import type { Codec } from '@polkadot/types-codec/types';
import type { FrameSupportPalletId } from '@polkadot/types/lookup';

declare module '@polkadot/api-base/types/consts' {
  export interface AugmentedConsts<ApiType extends ApiTypes> {
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
    dkg: {
      /**
       * Percentage session should have progressed for refresh to begin
       **/
      refreshDelay: Permill & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    dkgProposalHandler: {
      /**
       * Max number of signed proposal submissions per batch;
       **/
      maxSubmissionsPerBatch: u16 & AugmentedConst<ApiType>;
      /**
       * Generic const
       **/
      [key: string]: Codec;
    };
    dkgProposals: {
      /**
       * The identifier for this chain.
       * This must be unique and must not collide with existing IDs within a
       * set of bridged chains.
       **/
      chainIdentifier: WebbProposalsHeaderTypedChainId & AugmentedConst<ApiType>;
      /**
       * The session period
       **/
      period: u32 & AugmentedConst<ApiType>;
      proposalLifetime: u32 & AugmentedConst<ApiType>;
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
} // declare module
