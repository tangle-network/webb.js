// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api/types';
import type { Bytes, Null, Option, U8aFixed, Vec, u128, u32, u64 } from '@polkadot/types';
import type { AnyNumber, Observable } from '@polkadot/types/types';
import type { DarkwebbPrimitivesDepositDetails, OrmlTokensAccountData, OrmlTokensBalanceLock, PalletAnchorHandlerUpdateRecord, PalletAssetRegistryAssetDetails, PalletAssetRegistryAssetMetadata } from '@webb-tools/types/interfaces/pallets';
import type { AccountId32 } from '@webb-tools/types/interfaces/runtime';

declare module '@polkadot/api/types/storage' {
  export interface AugmentedQueries<ApiType> {
    anchorHandler: {
      /**
       * The map of trees to their anchor metadata
       **/
      anchorList: AugmentedQuery<ApiType, (arg: U8aFixed | string | Uint8Array) => Observable<u32>, [U8aFixed]> & QueryableStorageEntry<ApiType, [U8aFixed]>;
      /**
       * The number of updates
       **/
      counts: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<u64>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * sourceChainID => nonce => Update Record
       **/
      updateRecords: AugmentedQuery<ApiType, (arg1: u32 | AnyNumber | Uint8Array, arg2: u64 | AnyNumber | Uint8Array) => Observable<PalletAnchorHandlerUpdateRecord>, [u32, u64]> & QueryableStorageEntry<ApiType, [u32, u64]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    assetRegistry: {
      /**
       * Mapping between asset name and asset id.
       **/
      assetIds: AugmentedQuery<ApiType, (arg: Bytes | string | Uint8Array) => Observable<Option<u32>>, [Bytes]> & QueryableStorageEntry<ApiType, [Bytes]>;
      /**
       * Native location of an asset.
       **/
      assetLocations: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<Null>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Metadata of an asset.
       **/
      assetMetadataMap: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletAssetRegistryAssetMetadata>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Details of an asset.
       **/
      assets: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletAssetRegistryAssetDetails>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Local asset for native location.
       **/
      locationAssets: AugmentedQuery<ApiType, (arg: Null | null) => Observable<Option<u32>>, [Null]> & QueryableStorageEntry<ApiType, [Null]>;
      /**
       * Next available asset id. This is sequential id assigned for each new
       * registered asset.
       **/
      nextAssetId: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    tokens: {
      /**
       * The balance of a token type under an account.
       * 
       * NOTE: If the total is ever zero, decrease account ref account.
       * 
       * NOTE: This is only used in the case that this module is used to store
       * balances.
       **/
      accounts: AugmentedQuery<ApiType, (arg1: AccountId32 | string | Uint8Array, arg2: u32 | AnyNumber | Uint8Array) => Observable<OrmlTokensAccountData>, [AccountId32, u32]> & QueryableStorageEntry<ApiType, [AccountId32, u32]>;
      /**
       * Any liquidity locks of a token type under an account.
       * NOTE: Should only be accessed when setting, changing and freeing a lock.
       **/
      locks: AugmentedQuery<ApiType, (arg1: AccountId32 | string | Uint8Array, arg2: u32 | AnyNumber | Uint8Array) => Observable<Vec<OrmlTokensBalanceLock>>, [AccountId32, u32]> & QueryableStorageEntry<ApiType, [AccountId32, u32]>;
      /**
       * The total issuance of a token type.
       **/
      totalIssuance: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<u128>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    verifier: {
      /**
       * Details of the module's parameters
       **/
      deposit: AugmentedQuery<ApiType, () => Observable<Option<DarkwebbPrimitivesDepositDetails>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The parameter maintainer who can change the parameters
       **/
      maintainer: AugmentedQuery<ApiType, () => Observable<AccountId32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Details of the module's parameters
       **/
      parameters: AugmentedQuery<ApiType, () => Observable<Bytes>, []> & QueryableStorageEntry<ApiType, []>;
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
