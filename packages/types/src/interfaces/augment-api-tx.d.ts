// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { Bytes, Compact, Null, Option, Vec, bool, u128, u16, u32, u8 } from '@polkadot/types-codec';
import type { AnyNumber } from '@polkadot/types-codec/types';

declare module '@polkadot/api-base/types/submittable' {
  export interface AugmentedSubmittables<ApiType extends ApiTypes> {
    anchorBn254: {
      create: AugmentedSubmittable<(depositSize: u128 | AnyNumber | Uint8Array, maxEdges: u32 | AnyNumber | Uint8Array, depth: u8 | AnyNumber | Uint8Array, asset: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128, u32, u8, u32]>;
      deposit: AugmentedSubmittable<(treeId: u32 | AnyNumber | Uint8Array, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
      /**
       * Same as [Self::deposit] but with another call to update the linked
       * anchors cross-chain (if any).
       **/
      depositAndUpdateLinkedAnchors: AugmentedSubmittable<(treeId: u32 | AnyNumber | Uint8Array, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
      withdraw: AugmentedSubmittable<(id: u32 | AnyNumber | Uint8Array, proofBytes: Bytes | string | Uint8Array, roots: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement> | (EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array)[], nullifierHash: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array, recipient: AccountId32 | string | Uint8Array, relayer: AccountId32 | string | Uint8Array, fee: u128 | AnyNumber | Uint8Array, refund: u128 | AnyNumber | Uint8Array, commitment: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, Bytes, Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>, EggStandaloneRuntimeProtocolSubstrateConfigElement, AccountId32, AccountId32, u128, u128, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    assetRegistry: {
      /**
       * Add an asset to an existing pool.
       **/
      addAssetToPool: AugmentedSubmittable<(pool: Bytes | string | Uint8Array, assetId: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u32]>;
      /**
       * Remove an asset from an existing pool.
       **/
      deleteAssetFromPool: AugmentedSubmittable<(pool: Bytes | string | Uint8Array, assetId: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [Bytes, u32]>;
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
       * - `symbol`: The exchange symbol for this asset. Limited in length by `StringLimit`.
       * - `decimals`: The number of decimals this asset uses to represent one unit.
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
    dkg: {
      /**
       * Forcefully rotate the DKG
       * 
       * This forces the next authorities into the current authority spot and
       * automatically increments the authority ID. It uses `change_authorities`
       * to execute the rotation forcefully.
       **/
      forceChangeAuthorities: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Force removes an authority from keygen jail.
       * 
       * Can only be called by the root origin.
       * 
       * * `origin` - The account origin.
       * * `authority` - The authority to be removed from the keygen jail.
       **/
      forceUnjailKeygen: AugmentedSubmittable<(authority: DkgRuntimePrimitivesCryptoPublic | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesCryptoPublic]>;
      /**
       * Force removes an authority from signing jail.
       * 
       * Can only be called by the root origin.
       * 
       * * `origin` - The account origin.
       * * `authority` - The authority to be removed from the signing jail.
       **/
      forceUnjailSigning: AugmentedSubmittable<(authority: DkgRuntimePrimitivesCryptoPublic | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesCryptoPublic]>;
      /**
       * Manually Update the `RefreshNonce` (increment it by one).
       * 
       * Can only be called by the root origin.
       * 
       * * `origin` - The account origin.
       * **Important**: This function is only available for testing purposes.
       **/
      manualIncrementNonce: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Manual Trigger DKG Refresh process.
       * 
       * Can only be called by the root origin.
       * 
       * * `origin` - The account that is initiating the refresh process.
       * **Important**: This function is only available for testing purposes.
       **/
      manualRefresh: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Set the pending keygen threshold for the session following the next session.
       * 
       * We cannot assume that the next DKG has not already completed keygen.
       * After all, if we are in a new session the next DKG may have already completed.
       * Therefore, when we update the thresholds we are updating a threshold
       * that will become the next threshold after the next session update.
       * 
       * * `origin` - The account origin.
       * * `new_threshold` - The new keygen threshold for the DKG.
       **/
      setKeygenThreshold: AugmentedSubmittable<(newThreshold: u16 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16]>;
      /**
       * Sets the delay when a unsigned `RefreshProposal` will be added to the unsigned
       * proposal queue.
       * 
       * * `origin` - The account origin.
       * * `new_delay` - The percentage of elapsed session duration to wait before adding an
       * unsigned refresh proposal to the unsigned proposal queue.
       **/
      setRefreshDelay: AugmentedSubmittable<(newDelay: u8 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u8]>;
      /**
       * Set the pending signature threshold for the session following the next session.
       * 
       * We cannot assume that the next DKG has not already completed keygen.
       * After all, if we are in a new session the next DKG may have already completed.
       * Therefore, when we update the thresholds we are updating a threshold
       * that will become the next threshold after the next session update.
       * 
       * * `origin` - The account origin.
       * * `new_threshold` - The new signature threshold for the DKG.
       **/
      setSignatureThreshold: AugmentedSubmittable<(newThreshold: u16 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u16]>;
      /**
       * Submits misbehaviour reports on chain. Signatures of the offending authority are
       * verified against the current or next authorities depending on the type of misbehaviour.
       * - Keygen: Verifies against the next authorities, since they are doing keygen.
       * - Signing: Verifies against the current authorities, since they are doing signing.
       * 
       * Verifies the reports against the respective thresholds and if enough reports are met
       * begins to jail and decrease the reputation of the offending authority.
       * 
       * The misbehaviour reputation update is:
       * AUTHORITY_REPUTATION = DECAY_PERCENTAGE * AUTHORITY_REPUTATION
       * 
       * If there are not enough unjailed keygen authorities to perform a keygen after the next
       * session, then we deduct the pending keygen threshold (and pending signing threshold)
       * accordingly.
       * 
       * * `origin` - The account origin.
       * * `reports` - The aggregated misbehaviour reports containing signatures of an offending
       * authority
       **/
      submitMisbehaviourReports: AugmentedSubmittable<(reports: DkgRuntimePrimitivesAggregatedMisbehaviourReports | { misbehaviourType?: any; roundId?: any; offender?: any; reporters?: any; signatures?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesAggregatedMisbehaviourReports]>;
      /**
       * Submits and stores the next public key for the next session into the on-chain storage.
       * 
       * Can only be submitted by the next authorities. It is also required that a
       * `NextSignatureThreshold` of submissions is reached in order to successfully
       * store the public key on-chain.
       * 
       * * `origin` - The account origin.
       * * `keys_and_signatures` - The aggregated public keys and signatures for possible next
       * DKG public keys.
       **/
      submitNextPublicKey: AugmentedSubmittable<(keysAndSignatures: DkgRuntimePrimitivesAggregatedPublicKeys | { keysAndSignatures?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesAggregatedPublicKeys]>;
      /**
       * Submits and stores the active public key for the genesis session into the on-chain
       * storage. This is primarily used to separate the genesis public key submission from
       * non-genesis rounds.
       * 
       * Can only be submitted by the current authorities. It is also required that a
       * `SignatureThreshold` of submissions is reached in order to successfully
       * store the public key on-chain.
       * 
       * * `origin` - The account origin.
       * * `keys_and_signatures` - The aggregated public keys and signatures for possible current
       * DKG public keys.
       **/
      submitPublicKey: AugmentedSubmittable<(keysAndSignatures: DkgRuntimePrimitivesAggregatedPublicKeys | { keysAndSignatures?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesAggregatedPublicKeys]>;
      /**
       * Submits the public key signature for the key refresh/rotation process.
       * 
       * The signature is the signature of the next public key `RefreshProposal`, signed by the
       * current DKG. It is stored on-chain only if it verifies successfully against the current
       * DKG's public key. Successful storage of this public key signature also removes
       * the unsigned `RefreshProposal` from the unsigned queue.
       * 
       * For manual refreshes, after the signature is submitted and stored on-chain,
       * the keys are immediately refreshed and the authority set is immediately rotated
       * and incremented.
       * 
       * * `origin` - The account origin.
       * * `signature_proposal` - The signed refresh proposal containing the public key signature
       * and nonce.
       **/
      submitPublicKeySignature: AugmentedSubmittable<(signatureProposal: DkgRuntimePrimitivesProposalRefreshProposalSigned | { nonce?: any; signature?: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesProposalRefreshProposalSigned]>;
      /**
       * Attempts to remove an authority from all possible jails (keygen & signing).
       * This can only be called by the controller of the authority in jail. The
       * origin must map directly to the authority in jail.
       * 
       * The authority's jail sentence for either keygen or signing must be elapsed
       * for the authority to be removed from the jail.
       * 
       * * `origin` - The account origin.
       **/
      unjail: AugmentedSubmittable<() => SubmittableExtrinsic<ApiType>, []>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    dkgProposalHandler: {
      /**
       * Force submit an unsigned proposal to the DKG
       * 
       * There are certain proposals we'd like to be proposable only
       * through root actions. The currently supported proposals are
       * 1. Updating
       **/
      forceSubmitUnsignedProposal: AugmentedSubmittable<(prop: DkgRuntimePrimitivesProposal | { Signed: any } | { Unsigned: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [DkgRuntimePrimitivesProposal]>;
      submitSignedProposals: AugmentedSubmittable<(props: Vec<DkgRuntimePrimitivesProposal> | (DkgRuntimePrimitivesProposal | { Signed: any } | { Unsigned: any } | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<DkgRuntimePrimitivesProposal>]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    dkgProposals: {
      /**
       * Commits a vote in favour of the provided proposal.
       * 
       * If a proposal with the given nonce and source chain ID does not
       * already exist, it will be created with an initial vote in favour
       * from the caller.
       * 
       * # <weight>
       * - weight of proposed call, regardless of whether execution is performed
       * # </weight>
       **/
      acknowledgeProposal: AugmentedSubmittable<(nonce: u32 | AnyNumber | Uint8Array, srcChainId: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array, rId: WebbProposalsHeaderResourceId | string | Uint8Array, prop: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, WebbProposalsHeaderTypedChainId, WebbProposalsHeaderResourceId, Bytes]>;
      /**
       * Adds a new proposer to the proposer set.
       * 
       * # <weight>
       * - O(1) lookup and insert
       * # </weight>
       **/
      addProposer: AugmentedSubmittable<(nativeAccount: AccountId32 | string | Uint8Array, externalAccount: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32, Bytes]>;
      /**
       * Evaluate the state of a proposal given the current vote threshold.
       * 
       * A proposal with enough votes will be either executed or cancelled,
       * and the status will be updated accordingly.
       * 
       * # <weight>
       * - weight of proposed call, regardless of whether execution is performed
       * # </weight>
       **/
      evalVoteState: AugmentedSubmittable<(nonce: u32 | AnyNumber | Uint8Array, srcChainId: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array, prop: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, WebbProposalsHeaderTypedChainId, Bytes]>;
      /**
       * Commits a vote against a provided proposal.
       * 
       * # <weight>
       * - Fixed, since execution of proposal should not be included
       * # </weight>
       **/
      rejectProposal: AugmentedSubmittable<(nonce: u32 | AnyNumber | Uint8Array, srcChainId: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array, rId: WebbProposalsHeaderResourceId | string | Uint8Array, prop: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, WebbProposalsHeaderTypedChainId, WebbProposalsHeaderResourceId, Bytes]>;
      /**
       * Removes an existing proposer from the set.
       * 
       * # <weight>
       * - O(1) lookup and removal
       * # </weight>
       **/
      removeProposer: AugmentedSubmittable<(v: AccountId32 | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [AccountId32]>;
      /**
       * Removes a resource ID from the resource mapping.
       * 
       * After this call, bridge transfers with the associated resource ID
       * will be rejected.
       * 
       * # <weight>
       * - O(1) removal
       * # </weight>
       **/
      removeResource: AugmentedSubmittable<(id: WebbProposalsHeaderResourceId | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WebbProposalsHeaderResourceId]>;
      /**
       * Stores a method name on chain under an associated resource ID.
       * 
       * # <weight>
       * - O(1) write
       * # </weight>
       **/
      setResource: AugmentedSubmittable<(id: WebbProposalsHeaderResourceId | string | Uint8Array, method: Bytes | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WebbProposalsHeaderResourceId, Bytes]>;
      /**
       * Sets the vote threshold for proposals.
       * 
       * This threshold is used to determine how many votes are required
       * before a proposal is executed.
       * 
       * # <weight>
       * - O(1) lookup and insert
       * # </weight>
       **/
      setThreshold: AugmentedSubmittable<(threshold: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32]>;
      /**
       * Enables a chain ID as a source or destination for a bridge transfer.
       * 
       * # <weight>
       * - O(1) lookup and insert
       * # </weight>
       **/
      whitelistChain: AugmentedSubmittable<(chainId: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [WebbProposalsHeaderTypedChainId]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    merkleTreeBn254: {
      create: AugmentedSubmittable<(depth: u8 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u8]>;
      forceSetDefaultHashes: AugmentedSubmittable<(defaultHashes: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement> | (EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array)[]) => SubmittableExtrinsic<ApiType>, [Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>]>;
      insert: AugmentedSubmittable<(treeId: u32 | AnyNumber | Uint8Array, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
      /**
       * Generic tx
       **/
      [key: string]: SubmittableExtrinsicFunction<ApiType>;
    };
    mixerBn254: {
      create: AugmentedSubmittable<(depositSize: u128 | AnyNumber | Uint8Array, depth: u8 | AnyNumber | Uint8Array, asset: u32 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u128, u8, u32]>;
      deposit: AugmentedSubmittable<(treeId: u32 | AnyNumber | Uint8Array, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
      withdraw: AugmentedSubmittable<(id: u32 | AnyNumber | Uint8Array, proofBytes: Bytes | string | Uint8Array, root: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array, nullifierHash: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array, recipient: AccountId32 | string | Uint8Array, relayer: AccountId32 | string | Uint8Array, fee: u128 | AnyNumber | Uint8Array, refund: u128 | AnyNumber | Uint8Array) => SubmittableExtrinsic<ApiType>, [u32, Bytes, EggStandaloneRuntimeProtocolSubstrateConfigElement, EggStandaloneRuntimeProtocolSubstrateConfigElement, AccountId32, AccountId32, u128, u128]>;
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
  } // AugmentedSubmittables
} // declare module
