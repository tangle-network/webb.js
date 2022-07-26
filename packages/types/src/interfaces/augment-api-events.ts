// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/events';

import type { ApiTypes, AugmentedEvent } from '@polkadot/api-base/types';
import type { Bytes, Null, Option, Result, U8aFixed, Vec, bool, i128, u128, u32, u64, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, H256 } from '@polkadot/types/interfaces/runtime';
import type { DkgRuntimePrimitivesCryptoPublic, DkgRuntimePrimitivesMisbehaviourType, DkgRuntimePrimitivesProposalDkgPayloadKey, DkgRuntimePrimitivesProposalProposalKind, EggStandaloneRuntimeProtocolSubstrateConfigElement, FrameSupportScheduleLookupError, FrameSupportTokensMiscBalanceStatus, FrameSupportWeightsDispatchInfo, PalletAssetRegistryAssetType, PalletDemocracyVoteAccountVote, PalletDemocracyVoteThreshold, PalletElectionProviderMultiPhaseElectionCompute, PalletNominationPoolsPoolState, PalletStakingValidatorPrefs, SpFinalityGrandpaAppPublic, SpRuntimeDispatchError, WebbProposalsHeaderTypedChainId } from '@polkadot/types/lookup';

export type __AugmentedEvent<ApiType extends ApiTypes> = AugmentedEvent<ApiType>;

declare module '@polkadot/api-base/types/events' {
  interface AugmentedEvents<ApiType extends ApiTypes> {
    anchorVerifierBn254: {
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    assetRegistry: {
      /**
       * Native location set for an asset.
       **/
      LocationSet: AugmentedEvent<ApiType, [assetId: u32, location: u32], { assetId: u32, location: u32 }>;
      /**
       * Metadata set for an asset.
       **/
      MetadataSet: AugmentedEvent<ApiType, [assetId: u32, symbol_: Bytes, decimals: u8], { assetId: u32, symbol: Bytes, decimals: u8 }>;
      /**
       * Asset was registered.
       **/
      Registered: AugmentedEvent<ApiType, [assetId: u32, name: Bytes, assetType: PalletAssetRegistryAssetType], { assetId: u32, name: Bytes, assetType: PalletAssetRegistryAssetType }>;
      /**
       * Asset was updated.
       **/
      Updated: AugmentedEvent<ApiType, [assetId: u32, name: Bytes, assetType: PalletAssetRegistryAssetType], { assetId: u32, name: Bytes, assetType: PalletAssetRegistryAssetType }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    bagsList: {
      /**
       * Moved an account from one bag to another.
       **/
      Rebagged: AugmentedEvent<ApiType, [who: AccountId32, from: u64, to: u64], { who: AccountId32, from: u64, to: u64 }>;
      /**
       * Updated the score of some account to the given amount.
       **/
      ScoreUpdated: AugmentedEvent<ApiType, [who: AccountId32, newScore: u64], { who: AccountId32, newScore: u64 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    balances: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [who: AccountId32, free: u128, reserved: u128], { who: AccountId32, free: u128, reserved: u128 }>;
      /**
       * Some amount was deposited (e.g. for transaction fees).
       **/
      Deposit: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [account: AccountId32, amount: u128], { account: AccountId32, amount: u128 }>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<ApiType, [account: AccountId32, freeBalance: u128], { account: AccountId32, freeBalance: u128 }>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [from: AccountId32, to: AccountId32, amount: u128, destinationStatus: FrameSupportTokensMiscBalanceStatus], { from: AccountId32, to: AccountId32, amount: u128, destinationStatus: FrameSupportTokensMiscBalanceStatus }>;
      /**
       * Some amount was removed from the account (e.g. for misbehavior).
       **/
      Slashed: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<ApiType, [from: AccountId32, to: AccountId32, amount: u128], { from: AccountId32, to: AccountId32, amount: u128 }>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Some amount was withdrawn from the account (e.g. for transaction fees).
       **/
      Withdraw: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    bounties: {
      /**
       * A bounty is awarded to a beneficiary.
       **/
      BountyAwarded: AugmentedEvent<ApiType, [index: u32, beneficiary: AccountId32], { index: u32, beneficiary: AccountId32 }>;
      /**
       * A bounty proposal is funded and became active.
       **/
      BountyBecameActive: AugmentedEvent<ApiType, [index: u32], { index: u32 }>;
      /**
       * A bounty is cancelled.
       **/
      BountyCanceled: AugmentedEvent<ApiType, [index: u32], { index: u32 }>;
      /**
       * A bounty is claimed by beneficiary.
       **/
      BountyClaimed: AugmentedEvent<ApiType, [index: u32, payout: u128, beneficiary: AccountId32], { index: u32, payout: u128, beneficiary: AccountId32 }>;
      /**
       * A bounty expiry is extended.
       **/
      BountyExtended: AugmentedEvent<ApiType, [index: u32], { index: u32 }>;
      /**
       * New bounty proposal.
       **/
      BountyProposed: AugmentedEvent<ApiType, [index: u32], { index: u32 }>;
      /**
       * A bounty proposal was rejected; funds were slashed.
       **/
      BountyRejected: AugmentedEvent<ApiType, [index: u32, bond: u128], { index: u32, bond: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    bridge: {
      /**
       * Chain now available for transfers (chain_id)
       **/
      ChainWhitelisted: AugmentedEvent<ApiType, [chainId: u64], { chainId: u64 }>;
      /**
       * Voting successful for a proposal
       **/
      ProposalApproved: AugmentedEvent<ApiType, [chainId: u64, depositNonce: u64], { chainId: u64, depositNonce: u64 }>;
      /**
       * Execution of call failed
       **/
      ProposalFailed: AugmentedEvent<ApiType, [chainId: u64, depositNonce: u64], { chainId: u64, depositNonce: u64 }>;
      /**
       * Voting rejected a proposal
       **/
      ProposalRejected: AugmentedEvent<ApiType, [chainId: u64, depositNonce: u64], { chainId: u64, depositNonce: u64 }>;
      /**
       * Execution of call succeeded
       **/
      ProposalSucceeded: AugmentedEvent<ApiType, [chainId: u64, depositNonce: u64], { chainId: u64, depositNonce: u64 }>;
      /**
       * Relayer added to set
       **/
      RelayerAdded: AugmentedEvent<ApiType, [relayerId: AccountId32], { relayerId: AccountId32 }>;
      /**
       * Relayer removed from set
       **/
      RelayerRemoved: AugmentedEvent<ApiType, [relayerId: AccountId32], { relayerId: AccountId32 }>;
      /**
       * Vote threshold has changed (new_threshold)
       **/
      RelayerThresholdChanged: AugmentedEvent<ApiType, [newThreshold: u32], { newThreshold: u32 }>;
      /**
       * Vot submitted against proposal
       **/
      VoteAgainst: AugmentedEvent<ApiType, [chainId: u64, depositNonce: u64, who: AccountId32], { chainId: u64, depositNonce: u64, who: AccountId32 }>;
      /**
       * Vote submitted in favour of proposal
       **/
      VoteFor: AugmentedEvent<ApiType, [chainId: u64, depositNonce: u64, who: AccountId32], { chainId: u64, depositNonce: u64, who: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    childBounties: {
      /**
       * A child-bounty is added.
       **/
      Added: AugmentedEvent<ApiType, [index: u32, childIndex: u32], { index: u32, childIndex: u32 }>;
      /**
       * A child-bounty is awarded to a beneficiary.
       **/
      Awarded: AugmentedEvent<ApiType, [index: u32, childIndex: u32, beneficiary: AccountId32], { index: u32, childIndex: u32, beneficiary: AccountId32 }>;
      /**
       * A child-bounty is cancelled.
       **/
      Canceled: AugmentedEvent<ApiType, [index: u32, childIndex: u32], { index: u32, childIndex: u32 }>;
      /**
       * A child-bounty is claimed by beneficiary.
       **/
      Claimed: AugmentedEvent<ApiType, [index: u32, childIndex: u32, payout: u128, beneficiary: AccountId32], { index: u32, childIndex: u32, payout: u128, beneficiary: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    council: {
      /**
       * A motion was approved by the required threshold.
       **/
      Approved: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A proposal was closed because its threshold was reached or after its duration was up.
       **/
      Closed: AugmentedEvent<ApiType, [proposalHash: H256, yes: u32, no: u32], { proposalHash: H256, yes: u32, no: u32 }>;
      /**
       * A motion was not approved by the required threshold.
       **/
      Disapproved: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A motion was executed; result will be `Ok` if it returned without error.
       **/
      Executed: AugmentedEvent<ApiType, [proposalHash: H256, result: Result<Null, SpRuntimeDispatchError>], { proposalHash: H256, result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A single member did some action; result will be `Ok` if it returned without error.
       **/
      MemberExecuted: AugmentedEvent<ApiType, [proposalHash: H256, result: Result<Null, SpRuntimeDispatchError>], { proposalHash: H256, result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A motion (given hash) has been proposed (by given account) with a threshold (given
       * `MemberCount`).
       **/
      Proposed: AugmentedEvent<ApiType, [account: AccountId32, proposalIndex: u32, proposalHash: H256, threshold: u32], { account: AccountId32, proposalIndex: u32, proposalHash: H256, threshold: u32 }>;
      /**
       * A motion (given hash) has been voted on by given account, leaving
       * a tally (yes votes and no votes given respectively as `MemberCount`).
       **/
      Voted: AugmentedEvent<ApiType, [account: AccountId32, proposalHash: H256, voted: bool, yes: u32, no: u32], { account: AccountId32, proposalHash: H256, voted: bool, yes: u32, no: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    democracy: {
      /**
       * A proposal_hash has been blacklisted permanently.
       **/
      Blacklisted: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A referendum has been cancelled.
       **/
      Cancelled: AugmentedEvent<ApiType, [refIndex: u32], { refIndex: u32 }>;
      /**
       * An account has delegated their vote to another account.
       **/
      Delegated: AugmentedEvent<ApiType, [who: AccountId32, target: AccountId32], { who: AccountId32, target: AccountId32 }>;
      /**
       * A proposal has been enacted.
       **/
      Executed: AugmentedEvent<ApiType, [refIndex: u32, result: Result<Null, SpRuntimeDispatchError>], { refIndex: u32, result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * An external proposal has been tabled.
       **/
      ExternalTabled: AugmentedEvent<ApiType, []>;
      /**
       * A proposal has been rejected by referendum.
       **/
      NotPassed: AugmentedEvent<ApiType, [refIndex: u32], { refIndex: u32 }>;
      /**
       * A proposal has been approved by referendum.
       **/
      Passed: AugmentedEvent<ApiType, [refIndex: u32], { refIndex: u32 }>;
      /**
       * A proposal could not be executed because its preimage was invalid.
       **/
      PreimageInvalid: AugmentedEvent<ApiType, [proposalHash: H256, refIndex: u32], { proposalHash: H256, refIndex: u32 }>;
      /**
       * A proposal could not be executed because its preimage was missing.
       **/
      PreimageMissing: AugmentedEvent<ApiType, [proposalHash: H256, refIndex: u32], { proposalHash: H256, refIndex: u32 }>;
      /**
       * A proposal's preimage was noted, and the deposit taken.
       **/
      PreimageNoted: AugmentedEvent<ApiType, [proposalHash: H256, who: AccountId32, deposit: u128], { proposalHash: H256, who: AccountId32, deposit: u128 }>;
      /**
       * A registered preimage was removed and the deposit collected by the reaper.
       **/
      PreimageReaped: AugmentedEvent<ApiType, [proposalHash: H256, provider: AccountId32, deposit: u128, reaper: AccountId32], { proposalHash: H256, provider: AccountId32, deposit: u128, reaper: AccountId32 }>;
      /**
       * A proposal preimage was removed and used (the deposit was returned).
       **/
      PreimageUsed: AugmentedEvent<ApiType, [proposalHash: H256, provider: AccountId32, deposit: u128], { proposalHash: H256, provider: AccountId32, deposit: u128 }>;
      /**
       * A proposal got canceled.
       **/
      ProposalCanceled: AugmentedEvent<ApiType, [propIndex: u32], { propIndex: u32 }>;
      /**
       * A motion has been proposed by a public account.
       **/
      Proposed: AugmentedEvent<ApiType, [proposalIndex: u32, deposit: u128], { proposalIndex: u32, deposit: u128 }>;
      /**
       * An account has secconded a proposal
       **/
      Seconded: AugmentedEvent<ApiType, [seconder: AccountId32, propIndex: u32], { seconder: AccountId32, propIndex: u32 }>;
      /**
       * A referendum has begun.
       **/
      Started: AugmentedEvent<ApiType, [refIndex: u32, threshold: PalletDemocracyVoteThreshold], { refIndex: u32, threshold: PalletDemocracyVoteThreshold }>;
      /**
       * A public proposal has been tabled for referendum vote.
       **/
      Tabled: AugmentedEvent<ApiType, [proposalIndex: u32, deposit: u128, depositors: Vec<AccountId32>], { proposalIndex: u32, deposit: u128, depositors: Vec<AccountId32> }>;
      /**
       * An account has cancelled a previous delegation operation.
       **/
      Undelegated: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * An external proposal has been vetoed.
       **/
      Vetoed: AugmentedEvent<ApiType, [who: AccountId32, proposalHash: H256, until: u32], { who: AccountId32, proposalHash: H256, until: u32 }>;
      /**
       * An account has voted in a referendum
       **/
      Voted: AugmentedEvent<ApiType, [voter: AccountId32, refIndex: u32, vote: PalletDemocracyVoteAccountVote], { voter: AccountId32, refIndex: u32, vote: PalletDemocracyVoteAccountVote }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    dkg: {
      /**
       * Misbehaviour reports submitted
       **/
      MisbehaviourReportsSubmitted: AugmentedEvent<ApiType, [misbehaviourType: DkgRuntimePrimitivesMisbehaviourType, reporters: Vec<DkgRuntimePrimitivesCryptoPublic>], { misbehaviourType: DkgRuntimePrimitivesMisbehaviourType, reporters: Vec<DkgRuntimePrimitivesCryptoPublic> }>;
      /**
       * Next public key signature submitted
       **/
      NextPublicKeySignatureSubmitted: AugmentedEvent<ApiType, [pubKeySig: Bytes], { pubKeySig: Bytes }>;
      /**
       * Next public key submitted
       **/
      NextPublicKeySubmitted: AugmentedEvent<ApiType, [compressedPubKey: Bytes, uncompressedPubKey: Bytes], { compressedPubKey: Bytes, uncompressedPubKey: Bytes }>;
      /**
       * Current Public Key Changed.
       **/
      PublicKeyChanged: AugmentedEvent<ApiType, [compressedPubKey: Bytes, uncompressedPubKey: Bytes], { compressedPubKey: Bytes, uncompressedPubKey: Bytes }>;
      /**
       * Current Public Key Signature Changed.
       **/
      PublicKeySignatureChanged: AugmentedEvent<ApiType, [pubKeySig: Bytes], { pubKeySig: Bytes }>;
      /**
       * Current public key submitted
       **/
      PublicKeySubmitted: AugmentedEvent<ApiType, [compressedPubKey: Bytes, uncompressedPubKey: Bytes], { compressedPubKey: Bytes, uncompressedPubKey: Bytes }>;
      /**
       * Refresh DKG Keys Finished (forcefully).
       **/
      RefreshKeysFinished: AugmentedEvent<ApiType, [nextAuthoritySetId: u64], { nextAuthoritySetId: u64 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    dkgProposalHandler: {
      /**
       * Event Emitted when we encounter a Proposal with invalid Signature.
       **/
      InvalidProposalSignature: AugmentedEvent<ApiType, [kind: DkgRuntimePrimitivesProposalProposalKind, data: Bytes, invalidSignature: Bytes, expectedPublicKey: Option<Bytes>, actualPublicKey: Option<Bytes>], { kind: DkgRuntimePrimitivesProposalProposalKind, data: Bytes, invalidSignature: Bytes, expectedPublicKey: Option<Bytes>, actualPublicKey: Option<Bytes> }>;
      /**
       * Event When a Proposal Gets Signed by DKG.
       **/
      ProposalSigned: AugmentedEvent<ApiType, [key: DkgRuntimePrimitivesProposalDkgPayloadKey, targetChain: WebbProposalsHeaderTypedChainId, data: Bytes, signature: Bytes], { key: DkgRuntimePrimitivesProposalDkgPayloadKey, targetChain: WebbProposalsHeaderTypedChainId, data: Bytes, signature: Bytes }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    dkgProposals: {
      /**
       * Proposers have been reset
       **/
      AuthorityProposersReset: AugmentedEvent<ApiType, [proposers: Vec<AccountId32>], { proposers: Vec<AccountId32> }>;
      /**
       * Chain now available for transfers (chain_id)
       **/
      ChainWhitelisted: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId], { chainId: WebbProposalsHeaderTypedChainId }>;
      /**
       * Voting successful for a proposal
       **/
      ProposalApproved: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32], { chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32 }>;
      /**
       * Execution of call failed
       **/
      ProposalFailed: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32], { chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32 }>;
      /**
       * Voting rejected a proposal
       **/
      ProposalRejected: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32], { chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32 }>;
      /**
       * Execution of call succeeded
       **/
      ProposalSucceeded: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32], { chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32 }>;
      /**
       * Proposer added to set
       **/
      ProposerAdded: AugmentedEvent<ApiType, [proposerId: AccountId32], { proposerId: AccountId32 }>;
      /**
       * Proposer removed from set
       **/
      ProposerRemoved: AugmentedEvent<ApiType, [proposerId: AccountId32], { proposerId: AccountId32 }>;
      /**
       * Vote threshold has changed (new_threshold)
       **/
      ProposerThresholdChanged: AugmentedEvent<ApiType, [newThreshold: u32], { newThreshold: u32 }>;
      /**
       * Vot submitted against proposal
       **/
      VoteAgainst: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32, who: AccountId32], { chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32, who: AccountId32 }>;
      /**
       * Vote submitted in favour of proposal
       **/
      VoteFor: AugmentedEvent<ApiType, [chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32, who: AccountId32], { chainId: WebbProposalsHeaderTypedChainId, proposalNonce: u32, who: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    electionProviderMultiPhase: {
      /**
       * The election has been finalized, with `Some` of the given computation, or else if the
       * election failed, `None`.
       **/
      ElectionFinalized: AugmentedEvent<ApiType, [electionCompute: Option<PalletElectionProviderMultiPhaseElectionCompute>], { electionCompute: Option<PalletElectionProviderMultiPhaseElectionCompute> }>;
      /**
       * An account has been rewarded for their signed submission being finalized.
       **/
      Rewarded: AugmentedEvent<ApiType, [account: AccountId32, value: u128], { account: AccountId32, value: u128 }>;
      /**
       * The signed phase of the given round has started.
       **/
      SignedPhaseStarted: AugmentedEvent<ApiType, [round: u32], { round: u32 }>;
      /**
       * An account has been slashed for submitting an invalid signed submission.
       **/
      Slashed: AugmentedEvent<ApiType, [account: AccountId32, value: u128], { account: AccountId32, value: u128 }>;
      /**
       * A solution was stored with the given compute.
       * 
       * If the solution is signed, this means that it hasn't yet been processed. If the
       * solution is unsigned, this means that it has also been processed.
       * 
       * The `bool` is `true` when a previous solution was ejected to make room for this one.
       **/
      SolutionStored: AugmentedEvent<ApiType, [electionCompute: PalletElectionProviderMultiPhaseElectionCompute, prevEjected: bool], { electionCompute: PalletElectionProviderMultiPhaseElectionCompute, prevEjected: bool }>;
      /**
       * The unsigned phase of the given round has started.
       **/
      UnsignedPhaseStarted: AugmentedEvent<ApiType, [round: u32], { round: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    elections: {
      /**
       * A candidate was slashed by amount due to failing to obtain a seat as member or
       * runner-up.
       * 
       * Note that old members and runners-up are also candidates.
       **/
      CandidateSlashed: AugmentedEvent<ApiType, [candidate: AccountId32, amount: u128], { candidate: AccountId32, amount: u128 }>;
      /**
       * Internal error happened while trying to perform election.
       **/
      ElectionError: AugmentedEvent<ApiType, []>;
      /**
       * No (or not enough) candidates existed for this round. This is different from
       * `NewTerm(\[\])`. See the description of `NewTerm`.
       **/
      EmptyTerm: AugmentedEvent<ApiType, []>;
      /**
       * A member has been removed. This should always be followed by either `NewTerm` or
       * `EmptyTerm`.
       **/
      MemberKicked: AugmentedEvent<ApiType, [member: AccountId32], { member: AccountId32 }>;
      /**
       * A new term with new_members. This indicates that enough candidates existed to run
       * the election, not that enough have has been elected. The inner value must be examined
       * for this purpose. A `NewTerm(\[\])` indicates that some candidates got their bond
       * slashed and none were elected, whilst `EmptyTerm` means that no candidates existed to
       * begin with.
       **/
      NewTerm: AugmentedEvent<ApiType, [newMembers: Vec<ITuple<[AccountId32, u128]>>], { newMembers: Vec<ITuple<[AccountId32, u128]>> }>;
      /**
       * Someone has renounced their candidacy.
       **/
      Renounced: AugmentedEvent<ApiType, [candidate: AccountId32], { candidate: AccountId32 }>;
      /**
       * A seat holder was slashed by amount by being forcefully removed from the set.
       **/
      SeatHolderSlashed: AugmentedEvent<ApiType, [seatHolder: AccountId32, amount: u128], { seatHolder: AccountId32, amount: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    grandpa: {
      /**
       * New authority set has been applied.
       **/
      NewAuthorities: AugmentedEvent<ApiType, [authoritySet: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>], { authoritySet: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>> }>;
      /**
       * Current authority set has been paused.
       **/
      Paused: AugmentedEvent<ApiType, []>;
      /**
       * Current authority set has been resumed.
       **/
      Resumed: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    hasherBn254: {
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    indices: {
      /**
       * A account index was assigned.
       **/
      IndexAssigned: AugmentedEvent<ApiType, [who: AccountId32, index: u32], { who: AccountId32, index: u32 }>;
      /**
       * A account index has been freed up (unassigned).
       **/
      IndexFreed: AugmentedEvent<ApiType, [index: u32], { index: u32 }>;
      /**
       * A account index has been frozen to its current account ID.
       **/
      IndexFrozen: AugmentedEvent<ApiType, [index: u32, who: AccountId32], { index: u32, who: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    linkableTreeBn254: {
      /**
       * New tree created
       **/
      LinkableTreeCreation: AugmentedEvent<ApiType, [treeId: u32], { treeId: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    merkleTreeBn254: {
      /**
       * New leaf inserted
       **/
      LeafInsertion: AugmentedEvent<ApiType, [treeId: u32, leafIndex: u32, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement], { treeId: u32, leafIndex: u32, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement }>;
      /**
       * New tree created
       **/
      TreeCreation: AugmentedEvent<ApiType, [treeId: u32, who: AccountId32], { treeId: u32, who: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    mixerBn254: {
      Deposit: AugmentedEvent<ApiType, [treeId: u32, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement], { treeId: u32, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement }>;
      /**
       * New tree created
       **/
      MixerCreation: AugmentedEvent<ApiType, [treeId: u32], { treeId: u32 }>;
      Withdraw: AugmentedEvent<ApiType, [treeId: u32, recipient: AccountId32], { treeId: u32, recipient: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    mixerVerifierBn254: {
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    nominationPools: {
      /**
       * A member has became bonded in a pool.
       **/
      Bonded: AugmentedEvent<ApiType, [member: AccountId32, poolId: u32, bonded: u128, joined: bool], { member: AccountId32, poolId: u32, bonded: u128, joined: bool }>;
      /**
       * A pool has been created.
       **/
      Created: AugmentedEvent<ApiType, [depositor: AccountId32, poolId: u32], { depositor: AccountId32, poolId: u32 }>;
      /**
       * A pool has been destroyed.
       **/
      Destroyed: AugmentedEvent<ApiType, [poolId: u32], { poolId: u32 }>;
      /**
       * A member has been removed from a pool.
       * 
       * The removal can be voluntary (withdrawn all unbonded funds) or involuntary (kicked).
       **/
      MemberRemoved: AugmentedEvent<ApiType, [poolId: u32, member: AccountId32], { poolId: u32, member: AccountId32 }>;
      /**
       * A payout has been made to a member.
       **/
      PaidOut: AugmentedEvent<ApiType, [member: AccountId32, poolId: u32, payout: u128], { member: AccountId32, poolId: u32, payout: u128 }>;
      /**
       * The active balance of pool `pool_id` has been slashed to `balance`.
       **/
      PoolSlashed: AugmentedEvent<ApiType, [poolId: u32, balance: u128], { poolId: u32, balance: u128 }>;
      /**
       * The roles of a pool have been updated to the given new roles. Note that the depositor
       * can never change.
       **/
      RolesUpdated: AugmentedEvent<ApiType, [root: Option<AccountId32>, stateToggler: Option<AccountId32>, nominator: Option<AccountId32>], { root: Option<AccountId32>, stateToggler: Option<AccountId32>, nominator: Option<AccountId32> }>;
      /**
       * The state of a pool has changed
       **/
      StateChanged: AugmentedEvent<ApiType, [poolId: u32, newState: PalletNominationPoolsPoolState], { poolId: u32, newState: PalletNominationPoolsPoolState }>;
      /**
       * A member has unbonded from their pool.
       * 
       * - `balance` is the corresponding balance of the number of points that has been
       * requested to be unbonded (the argument of the `unbond` transaction) from the bonded
       * pool.
       * - `points` is the number of points that are issued as a result of `balance` being
       * dissolved into the corresponding unbonding pool.
       * 
       * In the absence of slashing, these values will match. In the presence of slashing, the
       * number of points that are issued in the unbonding pool will be less than the amount
       * requested to be unbonded.
       **/
      Unbonded: AugmentedEvent<ApiType, [member: AccountId32, poolId: u32, balance: u128, points: u128], { member: AccountId32, poolId: u32, balance: u128, points: u128 }>;
      /**
       * The unbond pool at `era` of pool `pool_id` has been slashed to `balance`.
       **/
      UnbondingPoolSlashed: AugmentedEvent<ApiType, [poolId: u32, era: u32, balance: u128], { poolId: u32, era: u32, balance: u128 }>;
      /**
       * A member has withdrawn from their pool.
       * 
       * The given number of `points` have been dissolved in return of `balance`.
       * 
       * Similar to `Unbonded` event, in the absence of slashing, the ratio of point to balance
       * will be 1.
       **/
      Withdrawn: AugmentedEvent<ApiType, [member: AccountId32, poolId: u32, balance: u128, points: u128], { member: AccountId32, poolId: u32, balance: u128, points: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    offences: {
      /**
       * There is an offence reported of the given `kind` happened at the `session_index` and
       * (kind-specific) time slot. This event is not deposited for duplicate slashes.
       * \[kind, timeslot\].
       **/
      Offence: AugmentedEvent<ApiType, [kind: U8aFixed, timeslot: Bytes], { kind: U8aFixed, timeslot: Bytes }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    preimage: {
      /**
       * A preimage has ben cleared.
       **/
      Cleared: AugmentedEvent<ApiType, [hash_: H256], { hash_: H256 }>;
      /**
       * A preimage has been noted.
       **/
      Noted: AugmentedEvent<ApiType, [hash_: H256], { hash_: H256 }>;
      /**
       * A preimage has been requested.
       **/
      Requested: AugmentedEvent<ApiType, [hash_: H256], { hash_: H256 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    scheduler: {
      /**
       * The call for the provided hash was not found so the task has been aborted.
       **/
      CallLookupFailed: AugmentedEvent<ApiType, [task: ITuple<[u32, u32]>, id: Option<Bytes>, error: FrameSupportScheduleLookupError], { task: ITuple<[u32, u32]>, id: Option<Bytes>, error: FrameSupportScheduleLookupError }>;
      /**
       * Canceled some task.
       **/
      Canceled: AugmentedEvent<ApiType, [when: u32, index: u32], { when: u32, index: u32 }>;
      /**
       * Dispatched some task.
       **/
      Dispatched: AugmentedEvent<ApiType, [task: ITuple<[u32, u32]>, id: Option<Bytes>, result: Result<Null, SpRuntimeDispatchError>], { task: ITuple<[u32, u32]>, id: Option<Bytes>, result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * Scheduled some task.
       **/
      Scheduled: AugmentedEvent<ApiType, [when: u32, index: u32], { when: u32, index: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    session: {
      /**
       * New session has happened. Note that the argument is the session index, not the
       * block number as the type might suggest.
       **/
      NewSession: AugmentedEvent<ApiType, [sessionIndex: u32], { sessionIndex: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    signatureBridge: {
      /**
       * Chain now available for transfers (chain_id)
       **/
      ChainWhitelisted: AugmentedEvent<ApiType, [chainId: u64], { chainId: u64 }>;
      /**
       * Maintainer is set
       **/
      MaintainerSet: AugmentedEvent<ApiType, [oldMaintainer: Bytes, newMaintainer: Bytes], { oldMaintainer: Bytes, newMaintainer: Bytes }>;
      /**
       * Proposal has been approved
       **/
      ProposalApproved: AugmentedEvent<ApiType, [chainId: u64, proposalNonce: u32], { chainId: u64, proposalNonce: u32 }>;
      /**
       * Execution of call failed
       **/
      ProposalFailed: AugmentedEvent<ApiType, [chainId: u64, proposalNonce: u32], { chainId: u64, proposalNonce: u32 }>;
      /**
       * Execution of call succeeded
       **/
      ProposalSucceeded: AugmentedEvent<ApiType, [chainId: u64, proposalNonce: u32], { chainId: u64, proposalNonce: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    staking: {
      /**
       * An account has bonded this amount. \[stash, amount\]
       * 
       * NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
       * it will not be emitted for staking rewards when they are added to stake.
       **/
      Bonded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An account has stopped participating as either a validator or nominator.
       * \[stash\]
       **/
      Chilled: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * The era payout has been set; the first balance is the validator-payout; the second is
       * the remainder from the maximum amount of reward.
       * \[era_index, validator_payout, remainder\]
       **/
      EraPaid: AugmentedEvent<ApiType, [u32, u128, u128]>;
      /**
       * A nominator has been kicked from a validator. \[nominator, stash\]
       **/
      Kicked: AugmentedEvent<ApiType, [AccountId32, AccountId32]>;
      /**
       * An old slashing report from a prior era was discarded because it could
       * not be processed. \[session_index\]
       **/
      OldSlashingReportDiscarded: AugmentedEvent<ApiType, [u32]>;
      /**
       * The stakers' rewards are getting paid. \[era_index, validator_stash\]
       **/
      PayoutStarted: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * The nominator has been rewarded by this amount. \[stash, amount\]
       **/
      Rewarded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * One validator (and its nominators) has been slashed by the given amount.
       * \[validator, amount\]
       **/
      Slashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * A new set of stakers was elected.
       **/
      StakersElected: AugmentedEvent<ApiType, []>;
      /**
       * The election failed. No new era is planned.
       **/
      StakingElectionFailed: AugmentedEvent<ApiType, []>;
      /**
       * An account has unbonded this amount. \[stash, amount\]
       **/
      Unbonded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * A validator has set their preferences.
       **/
      ValidatorPrefsSet: AugmentedEvent<ApiType, [AccountId32, PalletStakingValidatorPrefs]>;
      /**
       * An account has called `withdraw_unbonded` and removed unbonding chunks worth `Balance`
       * from the unlocking queue. \[stash, amount\]
       **/
      Withdrawn: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    sudo: {
      /**
       * The \[sudoer\] just switched identity; the old key is supplied if one existed.
       **/
      KeyChanged: AugmentedEvent<ApiType, [oldSudoer: Option<AccountId32>], { oldSudoer: Option<AccountId32> }>;
      /**
       * A sudo just took place. \[result\]
       **/
      Sudid: AugmentedEvent<ApiType, [sudoResult: Result<Null, SpRuntimeDispatchError>], { sudoResult: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A sudo just took place. \[result\]
       **/
      SudoAsDone: AugmentedEvent<ApiType, [sudoResult: Result<Null, SpRuntimeDispatchError>], { sudoResult: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed.
       **/
      ExtrinsicFailed: AugmentedEvent<ApiType, [dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportWeightsDispatchInfo], { dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportWeightsDispatchInfo }>;
      /**
       * An extrinsic completed successfully.
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [dispatchInfo: FrameSupportWeightsDispatchInfo], { dispatchInfo: FrameSupportWeightsDispatchInfo }>;
      /**
       * An account was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * A new account was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * On on-chain remark happened.
       **/
      Remarked: AugmentedEvent<ApiType, [sender: AccountId32, hash_: H256], { sender: AccountId32, hash_: H256 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tokens: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, free: u128, reserved: u128], { currencyId: u32, who: AccountId32, free: u128, reserved: u128 }>;
      /**
       * Deposited some balance into an account
       **/
      Deposited: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, amount: u128], { currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * An account was removed whose balance was non-zero but below
       * ExistentialDeposit, resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, amount: u128], { currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, amount: u128], { currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * Some locked funds were unlocked
       **/
      LockRemoved: AugmentedEvent<ApiType, [lockId: U8aFixed, currencyId: u32, who: AccountId32], { lockId: U8aFixed, currencyId: u32, who: AccountId32 }>;
      /**
       * Some funds are locked
       **/
      LockSet: AugmentedEvent<ApiType, [lockId: U8aFixed, currencyId: u32, who: AccountId32, amount: u128], { lockId: U8aFixed, currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, amount: u128], { currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * Some reserved balance was repatriated (moved from reserved to
       * another account).
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [currencyId: u32, from: AccountId32, to: AccountId32, amount: u128, status: FrameSupportTokensMiscBalanceStatus], { currencyId: u32, from: AccountId32, to: AccountId32, amount: u128, status: FrameSupportTokensMiscBalanceStatus }>;
      /**
       * Some balances were slashed (e.g. due to mis-behavior)
       **/
      Slashed: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, freeAmount: u128, reservedAmount: u128], { currencyId: u32, who: AccountId32, freeAmount: u128, reservedAmount: u128 }>;
      /**
       * The total issuance of an currency has been set
       **/
      TotalIssuanceSet: AugmentedEvent<ApiType, [currencyId: u32, amount: u128], { currencyId: u32, amount: u128 }>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<ApiType, [currencyId: u32, from: AccountId32, to: AccountId32, amount: u128], { currencyId: u32, from: AccountId32, to: AccountId32, amount: u128 }>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, amount: u128], { currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * Some balances were withdrawn (e.g. pay for transaction fee)
       **/
      Withdrawn: AugmentedEvent<ApiType, [currencyId: u32, who: AccountId32, amount: u128], { currencyId: u32, who: AccountId32, amount: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tokenWrapper: {
      UnwrappedToken: AugmentedEvent<ApiType, [poolShareAsset: u32, assetId: u32, amount: u128, recipient: AccountId32], { poolShareAsset: u32, assetId: u32, amount: u128, recipient: AccountId32 }>;
      UpdatedWrappingFeePercent: AugmentedEvent<ApiType, [intoPoolShareId: u32, wrappingFeePercent: u128], { intoPoolShareId: u32, wrappingFeePercent: u128 }>;
      WrappedToken: AugmentedEvent<ApiType, [poolShareAsset: u32, assetId: u32, amount: u128, recipient: AccountId32], { poolShareAsset: u32, assetId: u32, amount: u128, recipient: AccountId32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    transactionPayment: {
      /**
       * A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
       * has been paid by `who`.
       **/
      TransactionFeePaid: AugmentedEvent<ApiType, [who: AccountId32, actualFee: u128, tip: u128], { who: AccountId32, actualFee: u128, tip: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    treasury: {
      /**
       * Some funds have been allocated.
       **/
      Awarded: AugmentedEvent<ApiType, [proposalIndex: u32, award: u128, account: AccountId32], { proposalIndex: u32, award: u128, account: AccountId32 }>;
      /**
       * Some of our funds have been burnt.
       **/
      Burnt: AugmentedEvent<ApiType, [burntFunds: u128], { burntFunds: u128 }>;
      /**
       * Some funds have been deposited.
       **/
      Deposit: AugmentedEvent<ApiType, [value: u128], { value: u128 }>;
      /**
       * New proposal.
       **/
      Proposed: AugmentedEvent<ApiType, [proposalIndex: u32], { proposalIndex: u32 }>;
      /**
       * A proposal was rejected; funds were slashed.
       **/
      Rejected: AugmentedEvent<ApiType, [proposalIndex: u32, slashed: u128], { proposalIndex: u32, slashed: u128 }>;
      /**
       * Spending has finished; this is the amount that rolls over until next spend.
       **/
      Rollover: AugmentedEvent<ApiType, [rolloverBalance: u128], { rolloverBalance: u128 }>;
      /**
       * A new spend proposal has been approved.
       **/
      SpendApproved: AugmentedEvent<ApiType, [proposalIndex: u32, amount: u128, beneficiary: AccountId32], { proposalIndex: u32, amount: u128, beneficiary: AccountId32 }>;
      /**
       * We have ended a spend period and will now allocate funds.
       **/
      Spending: AugmentedEvent<ApiType, [budgetRemaining: u128], { budgetRemaining: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    vAnchorBn254: {
      /**
       * Deposit hook has executed successfully
       **/
      Deposit: AugmentedEvent<ApiType, [depositor: AccountId32, treeId: u32, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement], { depositor: AccountId32, treeId: u32, leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement }>;
      MaxDepositAmountChanged: AugmentedEvent<ApiType, [maxDepositAmount: u128], { maxDepositAmount: u128 }>;
      MinWithdrawAmountChanged: AugmentedEvent<ApiType, [minWithdrawAmount: u128], { minWithdrawAmount: u128 }>;
      /**
       * Transaction has been made
       **/
      Transaction: AugmentedEvent<ApiType, [transactor: AccountId32, treeId: u32, leafs: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>, amount: i128], { transactor: AccountId32, treeId: u32, leafs: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>, amount: i128 }>;
      /**
       * New tree created
       **/
      VAnchorCreation: AugmentedEvent<ApiType, [treeId: u32], { treeId: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    vAnchorHandlerBn254: {
      AnchorCreated: AugmentedEvent<ApiType, []>;
      AnchorEdgeAdded: AugmentedEvent<ApiType, []>;
      AnchorEdgeUpdated: AugmentedEvent<ApiType, []>;
      ResourceAnchored: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    vAnchorVerifier2x2Bn254: {
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
  } // AugmentedEvents
} // declare module
