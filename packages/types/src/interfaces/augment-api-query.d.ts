// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { Bytes, Null, Option, U8aFixed, Vec, bool, u128, u16, u32, u64 } from '@polkadot/types-codec';
import type { AnyNumber, ITuple } from '@polkadot/types-codec/types';
import type { Observable } from '@polkadot/types/types';

declare module '@polkadot/api-base/types/storage' {
  export interface AugmentedQueries<ApiType extends ApiTypes> {
    anchorBn254: {
      /**
       * The map of trees to their anchor metadata
       **/
      anchors: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletAnchorAnchorMetadata>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * The map of trees to their spent nullifier hashes
       **/
      nullifierHashes: AugmentedQuery<ApiType, (arg1: u32 | AnyNumber | Uint8Array, arg2: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => Observable<bool>, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]> & QueryableStorageEntry<ApiType, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
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
    dkg: {
      /**
       * Authority account ids scheduled for the next session
       **/
      accountToAuthority: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Option<U8aFixed>>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * The current authorities set
       **/
      authorities: AugmentedQuery<ApiType, () => Observable<Vec<DkgRuntimePrimitivesCryptoPublic>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Tracks authority reputations
       **/
      authorityReputations: AugmentedQuery<ApiType, (arg: DkgRuntimePrimitivesCryptoPublic | string | Uint8Array) => Observable<u128>, [DkgRuntimePrimitivesCryptoPublic]> & QueryableStorageEntry<ApiType, [DkgRuntimePrimitivesCryptoPublic]>;
      /**
       * The current authority set id
       **/
      authoritySetId: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current best authorities of the active keygen set
       **/
      bestAuthorities: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[u16, DkgRuntimePrimitivesCryptoPublic]>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Accounts for the current authorities
       **/
      currentAuthoritiesAccounts: AugmentedQuery<ApiType, () => Observable<Vec<AccountId32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Holds active public key for ongoing session
       **/
      dkgPublicKey: AugmentedQuery<ApiType, () => Observable<ITuple<[u64, Bytes]>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Signature of the current DKG public key
       **/
      dkgPublicKeySignature: AugmentedQuery<ApiType, () => Observable<Bytes>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Tracks current proposer set
       **/
      historicalRounds: AugmentedQuery<ApiType, (arg: u64 | AnyNumber | Uint8Array) => Observable<PalletDkgMetadataRoundMetadata>, [u64]> & QueryableStorageEntry<ApiType, [u64]>;
      /**
       * Tracks jailed authorities for keygen by mapping
       * to the block number when the authority was last jailed
       **/
      jailedKeygenAuthorities: AugmentedQuery<ApiType, (arg: DkgRuntimePrimitivesCryptoPublic | string | Uint8Array) => Observable<u32>, [DkgRuntimePrimitivesCryptoPublic]> & QueryableStorageEntry<ApiType, [DkgRuntimePrimitivesCryptoPublic]>;
      /**
       * Tracks jailed authorities for signing by mapping
       * to the block number when the authority was last jailed
       **/
      jailedSigningAuthorities: AugmentedQuery<ApiType, (arg: DkgRuntimePrimitivesCryptoPublic | string | Uint8Array) => Observable<u32>, [DkgRuntimePrimitivesCryptoPublic]> & QueryableStorageEntry<ApiType, [DkgRuntimePrimitivesCryptoPublic]>;
      /**
       * The current signature threshold (i.e. the `n` in t-of-n)
       **/
      keygenThreshold: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Tracks misbehaviour reports
       **/
      misbehaviourReports: AugmentedQuery<ApiType, (arg: ITuple<[DkgRuntimePrimitivesMisbehaviourType, u64, DkgRuntimePrimitivesCryptoPublic]> | [DkgRuntimePrimitivesMisbehaviourType | 'Keygen' | 'Sign' | number | Uint8Array, u64 | AnyNumber | Uint8Array, DkgRuntimePrimitivesCryptoPublic | string | Uint8Array]) => Observable<Option<DkgRuntimePrimitivesAggregatedMisbehaviourReports>>, [ITuple<[DkgRuntimePrimitivesMisbehaviourType, u64, DkgRuntimePrimitivesCryptoPublic]>]> & QueryableStorageEntry<ApiType, [ITuple<[DkgRuntimePrimitivesMisbehaviourType, u64, DkgRuntimePrimitivesCryptoPublic]>]>;
      /**
       * Authorities set scheduled to be used with the next session
       **/
      nextAuthorities: AugmentedQuery<ApiType, () => Observable<Vec<DkgRuntimePrimitivesCryptoPublic>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Authority account ids scheduled for the next session
       **/
      nextAuthoritiesAccounts: AugmentedQuery<ApiType, () => Observable<Vec<AccountId32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The next authority set id
       **/
      nextAuthoritySetId: AugmentedQuery<ApiType, () => Observable<u64>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The next best authorities of the active keygen set
       **/
      nextBestAuthorities: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[u16, DkgRuntimePrimitivesCryptoPublic]>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Holds public key for next session
       **/
      nextDKGPublicKey: AugmentedQuery<ApiType, () => Observable<Option<ITuple<[u64, Bytes]>>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current signature threshold (i.e. the `n` in t-of-n)
       **/
      nextKeygenThreshold: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Signature of the DKG public key for the next session
       **/
      nextPublicKeySignature: AugmentedQuery<ApiType, () => Observable<Option<Bytes>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current signature threshold (i.e. the `t` in t-of-n)
       **/
      nextSignatureThreshold: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The pending signature threshold (i.e. the `n` in t-of-n)
       **/
      pendingKeygenThreshold: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The pending signature threshold (i.e. the `t` in t-of-n)
       **/
      pendingSignatureThreshold: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Holds public key for immediate past session
       **/
      previousPublicKey: AugmentedQuery<ApiType, () => Observable<ITuple<[u64, Bytes]>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Session progress required to kickstart refresh process
       **/
      refreshDelay: AugmentedQuery<ApiType, () => Observable<Permill>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Check if there is a refresh in progress.
       **/
      refreshInProgress: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Nonce value for next refresh proposal
       **/
      refreshNonce: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Should we manually trigger a DKG refresh process.
       **/
      shouldManualRefresh: AugmentedQuery<ApiType, () => Observable<bool>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The current signature threshold (i.e. the `t` in t-of-n)
       **/
      signatureThreshold: AugmentedQuery<ApiType, () => Observable<u16>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Public key Signatures for past sessions
       **/
      usedSignatures: AugmentedQuery<ApiType, () => Observable<Vec<Bytes>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    dkgProposalHandler: {
      /**
       * All signed proposals.
       **/
      signedProposals: AugmentedQuery<ApiType, (arg1: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array, arg2: DkgRuntimePrimitivesProposalDkgPayloadKey | { EVMProposal: any } | { RefreshVote: any } | { ProposerSetUpdateProposal: any } | { AnchorCreateProposal: any } | { AnchorUpdateProposal: any } | { TokenAddProposal: any } | { TokenRemoveProposal: any } | { WrappingFeeUpdateProposal: any } | { ResourceIdUpdateProposal: any } | { RescueTokensProposal: any } | { MaxDepositLimitUpdateProposal: any } | { MinWithdrawalLimitUpdateProposal: any } | { SetVerifierProposal: any } | { SetTreasuryHandlerProposal: any } | { FeeRecipientUpdateProposal: any } | string | Uint8Array) => Observable<Option<DkgRuntimePrimitivesProposal>>, [WebbProposalsHeaderTypedChainId, DkgRuntimePrimitivesProposalDkgPayloadKey]> & QueryableStorageEntry<ApiType, [WebbProposalsHeaderTypedChainId, DkgRuntimePrimitivesProposalDkgPayloadKey]>;
      /**
       * All unsigned proposals.
       **/
      unsignedProposalQueue: AugmentedQuery<ApiType, (arg1: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array, arg2: DkgRuntimePrimitivesProposalDkgPayloadKey | { EVMProposal: any } | { RefreshVote: any } | { ProposerSetUpdateProposal: any } | { AnchorCreateProposal: any } | { AnchorUpdateProposal: any } | { TokenAddProposal: any } | { TokenRemoveProposal: any } | { WrappingFeeUpdateProposal: any } | { ResourceIdUpdateProposal: any } | { RescueTokensProposal: any } | { MaxDepositLimitUpdateProposal: any } | { MinWithdrawalLimitUpdateProposal: any } | { SetVerifierProposal: any } | { SetTreasuryHandlerProposal: any } | { FeeRecipientUpdateProposal: any } | string | Uint8Array) => Observable<Option<DkgRuntimePrimitivesProposal>>, [WebbProposalsHeaderTypedChainId, DkgRuntimePrimitivesProposalDkgPayloadKey]> & QueryableStorageEntry<ApiType, [WebbProposalsHeaderTypedChainId, DkgRuntimePrimitivesProposalDkgPayloadKey]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    dkgProposals: {
      /**
       * Tracks the authorities that are proposers so we can properly update the proposer set
       * across sessions and authority changes.
       **/
      authorityProposers: AugmentedQuery<ApiType, () => Observable<Vec<AccountId32>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * All whitelisted chains and their respective transaction counts
       **/
      chainNonces: AugmentedQuery<ApiType, (arg: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array) => Observable<Option<u32>>, [WebbProposalsHeaderTypedChainId]> & QueryableStorageEntry<ApiType, [WebbProposalsHeaderTypedChainId]>;
      /**
       * Tracks current proposer set external accounts
       **/
      externalAuthorityProposerAccounts: AugmentedQuery<ApiType, () => Observable<Vec<Bytes>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Tracks current proposer set external accounts
       * Currently meant to store Ethereum compatible 64-bytes ECDSA public keys
       **/
      externalProposerAccounts: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<Bytes>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Number of proposers in set
       **/
      proposerCount: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Tracks current proposer set
       **/
      proposers: AugmentedQuery<ApiType, (arg: AccountId32 | string | Uint8Array) => Observable<bool>, [AccountId32]> & QueryableStorageEntry<ApiType, [AccountId32]>;
      /**
       * Proposer Set Update Proposal Nonce
       **/
      proposerSetUpdateProposalNonce: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Number of votes required for a proposal to execute
       **/
      proposerThreshold: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Utilized by the bridge software to map resource IDs to actual methods
       **/
      resources: AugmentedQuery<ApiType, (arg: WebbProposalsHeaderResourceId | string | Uint8Array) => Observable<Option<Bytes>>, [WebbProposalsHeaderResourceId]> & QueryableStorageEntry<ApiType, [WebbProposalsHeaderResourceId]>;
      /**
       * All known proposals.
       * The key is the hash of the call and the deposit ID, to ensure it's
       * unique.
       **/
      votes: AugmentedQuery<ApiType, (arg1: WebbProposalsHeaderTypedChainId | { None: any } | { Evm: any } | { Substrate: any } | { PolkadotParachain: any } | { KusamaParachain: any } | { RococoParachain: any } | { Cosmos: any } | { Solana: any } | string | Uint8Array, arg2: ITuple<[u32, Bytes]> | [u32 | AnyNumber | Uint8Array, Bytes | string | Uint8Array]) => Observable<Option<PalletDkgProposalsProposalVotes>>, [WebbProposalsHeaderTypedChainId, ITuple<[u32, Bytes]>]> & QueryableStorageEntry<ApiType, [WebbProposalsHeaderTypedChainId, ITuple<[u32, Bytes]>]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    merkleTreeBn254: {
      /**
       * Map of root history from tree id to root index to root values
       **/
      cachedRoots: AugmentedQuery<ApiType, (arg1: u32 | AnyNumber | Uint8Array, arg2: u32 | AnyNumber | Uint8Array) => Observable<U8aFixed>, [u32, u32]> & QueryableStorageEntry<ApiType, [u32, u32]>;
      /**
       * The default hashes for this tree pallet
       **/
      defaultHashes: AugmentedQuery<ApiType, () => Observable<Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * Details of the module's parameters
       **/
      deposit: AugmentedQuery<ApiType, () => Observable<Option<WebbPrimitivesDepositDetails>>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The map of (tree_id, index) to the leaf commitment
       **/
      leaves: AugmentedQuery<ApiType, (arg1: u32 | AnyNumber | Uint8Array, arg2: u32 | AnyNumber | Uint8Array) => Observable<U8aFixed>, [u32, u32]> & QueryableStorageEntry<ApiType, [u32, u32]>;
      /**
       * The next tree identifier up for grabs
       **/
      nextLeafIndex: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<u32>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * The next tree identifier up for grabs
       **/
      nextRootIndex: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The next tree identifier up for grabs
       **/
      nextTreeId: AugmentedQuery<ApiType, () => Observable<u32>, []> & QueryableStorageEntry<ApiType, []>;
      /**
       * The map of trees to their metadata
       **/
      trees: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletMtTreeMetadata>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * Generic query
       **/
      [key: string]: QueryableStorageEntry<ApiType>;
    };
    mixerBn254: {
      /**
       * The map of trees to their mixer metadata
       **/
      mixers: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Option<PalletMixerMixerMetadata>>, [u32]> & QueryableStorageEntry<ApiType, [u32]>;
      /**
       * The map of trees to their spent nullifier hashes
       **/
      nullifierHashes: AugmentedQuery<ApiType, (arg1: u32 | AnyNumber | Uint8Array, arg2: EggStandaloneRuntimeProtocolSubstrateConfigElement | string | Uint8Array) => Observable<bool>, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]> & QueryableStorageEntry<ApiType, [u32, EggStandaloneRuntimeProtocolSubstrateConfigElement]>;
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
  } // AugmentedQueries
} // declare module
