// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes, SubmittableExtrinsic } from '@polkadot/api/types';
import type { Bytes, Compact, Null, Option, U8aFixed, bool, u128, u32, u8 } from '@polkadot/types';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { AnyNumber } from '@polkadot/types/types';
import type { PalletAnchorEdgeMetadata, PalletAssetRegistryAssetType } from '@webb-tools/types/interfaces/pallets';
import type { AccountId32, Call, MultiAddress } from '@webb-tools/types/interfaces/runtime';

declare module '@polkadot/api/types/submittable' {
  export interface AugmentedSubmittables<ApiType> {
    anchorHandler: {
      /**
       * This will be called by bridge when proposal to create an
       * anchor has been successfully voted on.
       **/
      executeAnchorCreateProposal: AugmentedSubmittable<(srcChainId: u32 | AnyNumber | Uint8Array, rId: U8aFixed | string | Uint8Array, maxEdges: u32 | AnyNumber | Uint8Array, treeDepth: u8 | AnyNumber | Uint8Array, asset: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, U8aFixed, u32, u8, u32]>;
      /**
       * This will be called by bridge when proposal to add/update edge of an
       * anchor has been successfully voted on.
       **/
      executeAnchorUpdateProposal: AugmentedSubmittable<(rId: U8aFixed | string | Uint8Array, anchorMetadata: PalletAnchorEdgeMetadata | { srcChainId?: any; root?: any; height?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [U8aFixed, PalletAnchorEdgeMetadata]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    assetRegistry: {
      /**
       * Register a new asset.
       * 
       * Asset is identified by `name` and the name must not be used to
       * register another asset.
       * 
       * New asset is given `NextAssetId` - sequential asset id
       * 
       * Adds mapping between `name` and assigned `asset_id` so asset id can
       * be retrieved by name too (Note: this approach is used in AMM
       * implementation (xyk))
       * 
       * Emits 'Registered` event when successful.
       **/
      register: AugmentedSubmittable<(name: Bytes | string | Uint8Array, assetType: PalletAssetRegistryAssetType | { Token: any } | { PoolShare: any } | string | Uint8Array, existentialDeposit: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, PalletAssetRegistryAssetType, u128]>;
      /**
       * Set asset native location.
       * 
       * Adds mapping between native location and local asset id and vice
       * versa.
       * 
       * Mainly used in XCM.
       * 
       * Emits `LocationSet` event when successful.
       **/
      setLocation: AugmentedSubmittable<(assetId: u32 | AnyNumber | Uint8Array, location: Null | null) => SubmittableExtrinsic<ApiType>, [u32, Null]>;
      /**
       * Set metadata for an asset.
       * 
       * - `asset_id`: Asset identifier.
       * - `symbol`: The exchange symbol for this asset. Limited in length by
       * `StringLimit`.
       * - `decimals`: The number of decimals this asset uses to represent
       * one unit.
       * 
       * Emits `MetadataSet` event when successful.
       **/
      setMetadata: AugmentedSubmittable<(assetId: u32 | AnyNumber | Uint8Array, symbol: Bytes | string | Uint8Array, decimals: u8 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, Bytes, u8]>;
      /**
       * Update registered asset.
       * 
       * Updates also mapping between name and asset id if provided name is
       * different than currently registered.
       * 
       * Emits `Updated` event when successful.
       **/
      update: AugmentedSubmittable<(assetId: u32 | AnyNumber | Uint8Array, name: Bytes | string | Uint8Array, assetType: PalletAssetRegistryAssetType | { Token: any } | { PoolShare: any } | string | Uint8Array, existentialDeposit: Option<u128> | null | object | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, Bytes, PalletAssetRegistryAssetType, Option<u128>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    tokens: {
      /**
       * Exactly as `transfer`, except the origin must be root and the source
       * account may be specified.
       * 
       * The dispatch origin for this call must be _Root_.
       * 
       * - `source`: The sender of the transfer.
       * - `dest`: The recipient of the transfer.
       * - `currency_id`: currency type.
       * - `amount`: free balance amount to tranfer.
       **/
      forceTransfer: AugmentedSubmittable<(source: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, currencyId: u32 | AnyNumber | Uint8Array, amount: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, MultiAddress, u32, Compact<u128>]>;
      /**
       * Set the balances of a given account.
       * 
       * This will alter `FreeBalance` and `ReservedBalance` in storage. it
       * will also decrease the total issuance of the system
       * (`TotalIssuance`). If the new free or reserved balance is below the
       * existential deposit, it will reap the `AccountInfo`.
       * 
       * The dispatch origin for this call is `root`.
       **/
      setBalance: AugmentedSubmittable<(who: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, currencyId: u32 | AnyNumber | Uint8Array, newFree: Compact<u128> | AnyNumber | Uint8Array, newReserved: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, u32, Compact<u128>, Compact<u128>]>;
      /**
       * Transfer some liquid free balance to another account.
       * 
       * `transfer` will set the `FreeBalance` of the sender and receiver.
       * It will decrease the total issuance of the system by the
       * `TransferFee`. If the sender's account is below the existential
       * deposit as a result of the transfer, the account will be reaped.
       * 
       * The dispatch origin for this call must be `Signed` by the
       * transactor.
       * 
       * - `dest`: The recipient of the transfer.
       * - `currency_id`: currency type.
       * - `amount`: free balance amount to tranfer.
       **/
      transfer: AugmentedSubmittable<(dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, currencyId: u32 | AnyNumber | Uint8Array, amount: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, u32, Compact<u128>]>;
      /**
       * Transfer all remaining balance to the given account.
       * 
       * NOTE: This function only attempts to transfer _transferable_
       * balances. This means that any locked, reserved, or existential
       * deposits (when `keep_alive` is `true`), will not be transferred by
       * this function. To ensure that this function results in a killed
       * account, you might need to prepare the account by removing any
       * reference counters, storage deposits, etc...
       * 
       * The dispatch origin for this call must be `Signed` by the
       * transactor.
       * 
       * - `dest`: The recipient of the transfer.
       * - `currency_id`: currency type.
       * - `keep_alive`: A boolean to determine if the `transfer_all`
       * operation should send all of the funds the account has, causing
       * the sender account to be killed (false), or transfer everything
       * except at least the existential deposit, which will guarantee to
       * keep the sender account alive (true).
       **/
      transferAll: AugmentedSubmittable<(dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, currencyId: u32 | AnyNumber | Uint8Array, keepAlive: bool | boolean | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, u32, bool]>;
      /**
       * Same as the [`transfer`] call, but with a check that the transfer
       * will not kill the origin account.
       * 
       * 99% of the time you want [`transfer`] instead.
       * 
       * The dispatch origin for this call must be `Signed` by the
       * transactor.
       * 
       * - `dest`: The recipient of the transfer.
       * - `currency_id`: currency type.
       * - `amount`: free balance amount to tranfer.
       **/
      transferKeepAlive: AugmentedSubmittable<(dest: MultiAddress | { Id: any } | { Index: any } | { Raw: any } | { Address32: any } | { Address20: any } | string | Uint8Array, currencyId: u32 | AnyNumber | Uint8Array, amount: Compact<u128> | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [MultiAddress, u32, Compact<u128>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    verifier: {
      forceSetMaintainer: AugmentedSubmittable<(newMaintainer: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      forceSetParameters: AugmentedSubmittable<(parameters: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      setMaintainer: AugmentedSubmittable<(newMaintainer: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      setParameters: AugmentedSubmittable<(parameters: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
  }

  export interface SubmittableExtrinsics<ApiType extends ApiTypes> extends AugmentedSubmittables<ApiType> {
    (extrinsic: Call | Extrinsic | Uint8Array | string): SubmittableExtrinsic<ApiType>;
    [key: string]: SubmittableModuleExtrinsics<ApiType>;
  }
}
