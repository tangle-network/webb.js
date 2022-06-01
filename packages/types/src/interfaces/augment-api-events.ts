// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { Bytes, Null, Option, Result, U8aFixed, Vec, bool, i128, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, H256 } from '@polkadot/types/interfaces/runtime';
import type { FrameSupportScheduleLookupError, FrameSupportTokensMiscBalanceStatus, FrameSupportWeightsDispatchInfo, PalletAssetRegistryAssetType, PalletDemocracyVoteAccountVote, PalletDemocracyVoteThreshold, PalletElectionProviderMultiPhaseElectionCompute, PalletImOnlineSr25519AppSr25519Public, PalletMultisigTimepoint, PalletNominationPoolsPoolState, PalletStakingExposure, PalletStakingValidatorPrefs, SpFinalityGrandpaAppPublic, SpRuntimeDispatchError, WebbStandaloneRuntimeElement, WebbStandaloneRuntimeProxyType } from '@polkadot/types/lookup';

declare module '@polkadot/api-base/types/events' {
  export interface AugmentedEvents<ApiType extends ApiTypes> {
    anchorBn254: {
      /**
       * New tree created
       **/
      AnchorCreation: AugmentedEvent<ApiType, [u32]>;
      /**
       * Amount has been deposited into the anchor
       **/
      Deposit: AugmentedEvent<ApiType, [AccountId32, u32, WebbStandaloneRuntimeElement, u128]>;
      /**
       * Post deposit hook has executed successfully
       **/
      PostDeposit: AugmentedEvent<ApiType, [AccountId32, u32, WebbStandaloneRuntimeElement]>;
      /**
       * A transaction has been refreshed (one spent, another inserted)
       **/
      Refresh: AugmentedEvent<ApiType, [u32, WebbStandaloneRuntimeElement]>;
      /**
       * Amount has been withdrawn from the anchor
       **/
      Withdraw: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    anchorHandlerBn254: {
      AnchorCreated: AugmentedEvent<ApiType, []>;
      AnchorEdgeAdded: AugmentedEvent<ApiType, []>;
      AnchorEdgeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
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
      LocationSet: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * Metadata set for an asset.
       **/
      MetadataSet: AugmentedEvent<ApiType, [u32, Bytes, u8]>;
      /**
       * Asset was registered.
       **/
      Registered: AugmentedEvent<ApiType, [u32, Bytes, PalletAssetRegistryAssetType]>;
      /**
       * Asset was updated.
       **/
      Updated: AugmentedEvent<ApiType, [u32, Bytes, PalletAssetRegistryAssetType]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    assets: {
      /**
       * An approval for account `delegate` was cancelled by `owner`.
       **/
      ApprovalCancelled: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32]>;
      /**
       * (Additional) funds have been approved for transfer to a destination account.
       **/
      ApprovedTransfer: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32, u128]>;
      /**
       * Some asset `asset_id` was frozen.
       **/
      AssetFrozen: AugmentedEvent<ApiType, [u32]>;
      /**
       * An asset has had its attributes changed by the `Force` origin.
       **/
      AssetStatusChanged: AugmentedEvent<ApiType, [u32]>;
      /**
       * Some asset `asset_id` was thawed.
       **/
      AssetThawed: AugmentedEvent<ApiType, [u32]>;
      /**
       * Some assets were destroyed.
       **/
      Burned: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * Some asset class was created.
       **/
      Created: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32]>;
      /**
       * An asset class was destroyed.
       **/
      Destroyed: AugmentedEvent<ApiType, [u32]>;
      /**
       * Some asset class was force-created.
       **/
      ForceCreated: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * Some account `who` was frozen.
       **/
      Frozen: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * Some assets were issued.
       **/
      Issued: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * Metadata has been cleared for an asset.
       **/
      MetadataCleared: AugmentedEvent<ApiType, [u32]>;
      /**
       * New metadata has been set for an asset.
       **/
      MetadataSet: AugmentedEvent<ApiType, [u32, Bytes, Bytes, u8, bool]>;
      /**
       * The owner changed.
       **/
      OwnerChanged: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * The management team changed.
       **/
      TeamChanged: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32, AccountId32]>;
      /**
       * Some account `who` was thawed.
       **/
      Thawed: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * Some assets were transferred.
       **/
      Transferred: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32, u128]>;
      /**
       * An `amount` was transferred in its entirety from `owner` to `destination` by
       * the approved `delegate`.
       **/
      TransferredApproved: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32, AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    bagsList: {
      /**
       * Moved an account from one bag to another.
       **/
      Rebagged: AugmentedEvent<ApiType, [AccountId32, u64, u64]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    balances: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [AccountId32, u128, u128]>;
      /**
       * Some amount was deposited (e.g. for transaction fees).
       **/
      Deposit: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [AccountId32, AccountId32, u128, FrameSupportTokensMiscBalanceStatus]>;
      /**
       * Some amount was removed from the account (e.g. for misbehavior).
       **/
      Slashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<ApiType, [AccountId32, AccountId32, u128]>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Some amount was withdrawn from the account (e.g. for transaction fees).
       **/
      Withdraw: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    bounties: {
      /**
       * A bounty is awarded to a beneficiary.
       **/
      BountyAwarded: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * A bounty proposal is funded and became active.
       **/
      BountyBecameActive: AugmentedEvent<ApiType, [u32]>;
      /**
       * A bounty is cancelled.
       **/
      BountyCanceled: AugmentedEvent<ApiType, [u32]>;
      /**
       * A bounty is claimed by beneficiary.
       **/
      BountyClaimed: AugmentedEvent<ApiType, [u32, u128, AccountId32]>;
      /**
       * A bounty expiry is extended.
       **/
      BountyExtended: AugmentedEvent<ApiType, [u32]>;
      /**
       * New bounty proposal.
       **/
      BountyProposed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A bounty proposal was rejected; funds were slashed.
       **/
      BountyRejected: AugmentedEvent<ApiType, [u32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    bridge: {
      /**
       * Chain now available for transfers (chain_id)
       **/
      ChainWhitelisted: AugmentedEvent<ApiType, [u64]>;
      /**
       * Voting successful for a proposal
       **/
      ProposalApproved: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Execution of call failed
       **/
      ProposalFailed: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Voting rejected a proposal
       **/
      ProposalRejected: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Execution of call succeeded
       **/
      ProposalSucceeded: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Relayer added to set
       **/
      RelayerAdded: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * Relayer removed from set
       **/
      RelayerRemoved: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * Vote threshold has changed (new_threshold)
       **/
      RelayerThresholdChanged: AugmentedEvent<ApiType, [u32]>;
      /**
       * Vot submitted against proposal
       **/
      VoteAgainst: AugmentedEvent<ApiType, [u64, u64, AccountId32]>;
      /**
       * Vote submitted in favour of proposal
       **/
      VoteFor: AugmentedEvent<ApiType, [u64, u64, AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    childBounties: {
      /**
       * A child-bounty is added.
       **/
      Added: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * A child-bounty is awarded to a beneficiary.
       **/
      Awarded: AugmentedEvent<ApiType, [u32, u32, AccountId32]>;
      /**
       * A child-bounty is cancelled.
       **/
      Canceled: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * A child-bounty is claimed by beneficiary.
       **/
      Claimed: AugmentedEvent<ApiType, [u32, u32, u128, AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    council: {
      /**
       * A motion was approved by the required threshold.
       **/
      Approved: AugmentedEvent<ApiType, [H256]>;
      /**
       * A proposal was closed because its threshold was reached or after its duration was up.
       **/
      Closed: AugmentedEvent<ApiType, [H256, u32, u32]>;
      /**
       * A motion was not approved by the required threshold.
       **/
      Disapproved: AugmentedEvent<ApiType, [H256]>;
      /**
       * A motion was executed; result will be `Ok` if it returned without error.
       **/
      Executed: AugmentedEvent<ApiType, [H256, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A single member did some action; result will be `Ok` if it returned without error.
       **/
      MemberExecuted: AugmentedEvent<ApiType, [H256, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A motion (given hash) has been proposed (by given account) with a threshold (given
       * `MemberCount`).
       **/
      Proposed: AugmentedEvent<ApiType, [AccountId32, u32, H256, u32]>;
      /**
       * A motion (given hash) has been voted on by given account, leaving
       * a tally (yes votes and no votes given respectively as `MemberCount`).
       **/
      Voted: AugmentedEvent<ApiType, [AccountId32, H256, bool, u32, u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    democracy: {
      /**
       * A proposal_hash has been blacklisted permanently.
       **/
      Blacklisted: AugmentedEvent<ApiType, [H256]>;
      /**
       * A referendum has been cancelled.
       **/
      Cancelled: AugmentedEvent<ApiType, [u32]>;
      /**
       * An account has delegated their vote to another account.
       **/
      Delegated: AugmentedEvent<ApiType, [AccountId32, AccountId32]>;
      /**
       * A proposal has been enacted.
       **/
      Executed: AugmentedEvent<ApiType, [u32, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * An external proposal has been tabled.
       **/
      ExternalTabled: AugmentedEvent<ApiType, []>;
      /**
       * A proposal has been rejected by referendum.
       **/
      NotPassed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A proposal has been approved by referendum.
       **/
      Passed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A proposal could not be executed because its preimage was invalid.
       **/
      PreimageInvalid: AugmentedEvent<ApiType, [H256, u32]>;
      /**
       * A proposal could not be executed because its preimage was missing.
       **/
      PreimageMissing: AugmentedEvent<ApiType, [H256, u32]>;
      /**
       * A proposal's preimage was noted, and the deposit taken.
       **/
      PreimageNoted: AugmentedEvent<ApiType, [H256, AccountId32, u128]>;
      /**
       * A registered preimage was removed and the deposit collected by the reaper.
       **/
      PreimageReaped: AugmentedEvent<ApiType, [H256, AccountId32, u128, AccountId32]>;
      /**
       * A proposal preimage was removed and used (the deposit was returned).
       **/
      PreimageUsed: AugmentedEvent<ApiType, [H256, AccountId32, u128]>;
      /**
       * A motion has been proposed by a public account.
       **/
      Proposed: AugmentedEvent<ApiType, [u32, u128]>;
      /**
       * An account has secconded a proposal
       **/
      Seconded: AugmentedEvent<ApiType, [AccountId32, u32]>;
      /**
       * A referendum has begun.
       **/
      Started: AugmentedEvent<ApiType, [u32, PalletDemocracyVoteThreshold]>;
      /**
       * A public proposal has been tabled for referendum vote.
       **/
      Tabled: AugmentedEvent<ApiType, [u32, u128, Vec<AccountId32>]>;
      /**
       * An account has cancelled a previous delegation operation.
       **/
      Undelegated: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * An external proposal has been vetoed.
       **/
      Vetoed: AugmentedEvent<ApiType, [AccountId32, H256, u64]>;
      /**
       * An account has voted in a referendum
       **/
      Voted: AugmentedEvent<ApiType, [AccountId32, u32, PalletDemocracyVoteAccountVote]>;
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
      ElectionFinalized: AugmentedEvent<ApiType, [Option<PalletElectionProviderMultiPhaseElectionCompute>]>;
      /**
       * An account has been rewarded for their signed submission being finalized.
       **/
      Rewarded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * The signed phase of the given round has started.
       **/
      SignedPhaseStarted: AugmentedEvent<ApiType, [u32]>;
      /**
       * An account has been slashed for submitting an invalid signed submission.
       **/
      Slashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * A solution was stored with the given compute.
       * 
       * If the solution is signed, this means that it hasn't yet been processed. If the
       * solution is unsigned, this means that it has also been processed.
       * 
       * The `bool` is `true` when a previous solution was ejected to make room for this one.
       **/
      SolutionStored: AugmentedEvent<ApiType, [PalletElectionProviderMultiPhaseElectionCompute, bool]>;
      /**
       * The unsigned phase of the given round has started.
       **/
      UnsignedPhaseStarted: AugmentedEvent<ApiType, [u32]>;
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
      CandidateSlashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
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
      MemberKicked: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * A new term with new_members. This indicates that enough candidates existed to run
       * the election, not that enough have has been elected. The inner value must be examined
       * for this purpose. A `NewTerm(\[\])` indicates that some candidates got their bond
       * slashed and none were elected, whilst `EmptyTerm` means that no candidates existed to
       * begin with.
       **/
      NewTerm: AugmentedEvent<ApiType, [Vec<ITuple<[AccountId32, u128]>>]>;
      /**
       * Someone has renounced their candidacy.
       **/
      Renounced: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * A seat holder was slashed by amount by being forcefully removed from the set.
       **/
      SeatHolderSlashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    grandpa: {
      /**
       * New authority set has been applied.
       **/
      NewAuthorities: AugmentedEvent<ApiType, [Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>]>;
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
    imOnline: {
      /**
       * At the end of the session, no offence was committed.
       **/
      AllGood: AugmentedEvent<ApiType, []>;
      /**
       * A new heartbeat was received from `AuthorityId`.
       **/
      HeartbeatReceived: AugmentedEvent<ApiType, [PalletImOnlineSr25519AppSr25519Public]>;
      /**
       * At the end of the session, at least one validator was found to be offline.
       **/
      SomeOffline: AugmentedEvent<ApiType, [Vec<ITuple<[AccountId32, PalletStakingExposure]>>]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    indices: {
      /**
       * A account index was assigned.
       **/
      IndexAssigned: AugmentedEvent<ApiType, [AccountId32, u32]>;
      /**
       * A account index has been freed up (unassigned).
       **/
      IndexFreed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A account index has been frozen to its current account ID.
       **/
      IndexFrozen: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    linkableTreeBn254: {
      /**
       * New tree created
       **/
      LinkableTreeCreation: AugmentedEvent<ApiType, [u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    merkleTreeBn254: {
      /**
       * New leaf inserted
       **/
      LeafInsertion: AugmentedEvent<ApiType, [u32, u32, WebbStandaloneRuntimeElement]>;
      /**
       * New tree created
       **/
      TreeCreation: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    mixerBn254: {
      Deposit: AugmentedEvent<ApiType, [u32, WebbStandaloneRuntimeElement]>;
      /**
       * New tree created
       **/
      MixerCreation: AugmentedEvent<ApiType, [u32]>;
      Withdraw: AugmentedEvent<ApiType, [u32, AccountId32]>;
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
    multisig: {
      /**
       * A multisig operation has been approved by someone.
       **/
      MultisigApproval: AugmentedEvent<ApiType, [AccountId32, PalletMultisigTimepoint, AccountId32, U8aFixed]>;
      /**
       * A multisig operation has been cancelled.
       **/
      MultisigCancelled: AugmentedEvent<ApiType, [AccountId32, PalletMultisigTimepoint, AccountId32, U8aFixed]>;
      /**
       * A multisig operation has been executed.
       **/
      MultisigExecuted: AugmentedEvent<ApiType, [AccountId32, PalletMultisigTimepoint, AccountId32, U8aFixed, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A new multisig operation has begun.
       **/
      NewMultisig: AugmentedEvent<ApiType, [AccountId32, AccountId32, U8aFixed]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    nominationPools: {
      /**
       * A member has became bonded in a pool.
       **/
      Bonded: AugmentedEvent<ApiType, [AccountId32, u32, u128, bool]>;
      /**
       * A pool has been created.
       **/
      Created: AugmentedEvent<ApiType, [AccountId32, u32]>;
      /**
       * A pool has been destroyed.
       **/
      Destroyed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A member has been removed from a pool.
       * 
       * The removal can be voluntary (withdrawn all unbonded funds) or involuntary (kicked).
       **/
      MemberRemoved: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * A payout has been made to a member.
       **/
      PaidOut: AugmentedEvent<ApiType, [AccountId32, u32, u128]>;
      /**
       * The roles of a pool have been updated to the given new roles.
       **/
      RolesUpdated: AugmentedEvent<ApiType, [AccountId32, AccountId32, AccountId32]>;
      /**
       * The state of a pool has changed
       **/
      StateChanged: AugmentedEvent<ApiType, [u32, PalletNominationPoolsPoolState]>;
      /**
       * A member has unbonded from their pool.
       **/
      Unbonded: AugmentedEvent<ApiType, [AccountId32, u32, u128]>;
      /**
       * A member has withdrawn from their pool.
       **/
      Withdrawn: AugmentedEvent<ApiType, [AccountId32, u32, u128]>;
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
      Offence: AugmentedEvent<ApiType, [U8aFixed, Bytes]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    preimage: {
      /**
       * A preimage has ben cleared.
       **/
      Cleared: AugmentedEvent<ApiType, [H256]>;
      /**
       * A preimage has been noted.
       **/
      Noted: AugmentedEvent<ApiType, [H256]>;
      /**
       * A preimage has been requested.
       **/
      Requested: AugmentedEvent<ApiType, [H256]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    proxy: {
      /**
       * An announcement was placed to make a call in the future.
       **/
      Announced: AugmentedEvent<ApiType, [AccountId32, AccountId32, H256]>;
      /**
       * Anonymous account has been created by new proxy with given
       * disambiguation index and proxy type.
       **/
      AnonymousCreated: AugmentedEvent<ApiType, [AccountId32, AccountId32, WebbStandaloneRuntimeProxyType, u16]>;
      /**
       * A proxy was added.
       **/
      ProxyAdded: AugmentedEvent<ApiType, [AccountId32, AccountId32, WebbStandaloneRuntimeProxyType, u64]>;
      /**
       * A proxy was executed correctly, with the given.
       **/
      ProxyExecuted: AugmentedEvent<ApiType, [Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A proxy was removed.
       **/
      ProxyRemoved: AugmentedEvent<ApiType, [AccountId32, AccountId32, WebbStandaloneRuntimeProxyType, u64]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    scheduler: {
      /**
       * The call for the provided hash was not found so the task has been aborted.
       **/
      CallLookupFailed: AugmentedEvent<ApiType, [ITuple<[u64, u32]>, Option<Bytes>, FrameSupportScheduleLookupError]>;
      /**
       * Canceled some task.
       **/
      Canceled: AugmentedEvent<ApiType, [u64, u32]>;
      /**
       * Dispatched some task.
       **/
      Dispatched: AugmentedEvent<ApiType, [ITuple<[u64, u32]>, Option<Bytes>, Result<Null, SpRuntimeDispatchError>]>;
      /**
       * Scheduled some task.
       **/
      Scheduled: AugmentedEvent<ApiType, [u64, u32]>;
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
      NewSession: AugmentedEvent<ApiType, [u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    signatureBridge: {
      /**
       * Chain now available for transfers (chain_id)
       **/
      ChainWhitelisted: AugmentedEvent<ApiType, [u64]>;
      /**
       * Maintainer is set
       **/
      MaintainerSet: AugmentedEvent<ApiType, [Bytes, Bytes]>;
      /**
       * Proposal has been approved
       **/
      ProposalApproved: AugmentedEvent<ApiType, [u64, u32]>;
      /**
       * Execution of call failed
       **/
      ProposalFailed: AugmentedEvent<ApiType, [u64, u32]>;
      /**
       * Execution of call succeeded
       **/
      ProposalSucceeded: AugmentedEvent<ApiType, [u64, u32]>;
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
      KeyChanged: AugmentedEvent<ApiType, [Option<AccountId32>]>;
      /**
       * A sudo just took place. \[result\]
       **/
      Sudid: AugmentedEvent<ApiType, [Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A sudo just took place. \[result\]
       **/
      SudoAsDone: AugmentedEvent<ApiType, [Result<Null, SpRuntimeDispatchError>]>;
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
      ExtrinsicFailed: AugmentedEvent<ApiType, [SpRuntimeDispatchError, FrameSupportWeightsDispatchInfo]>;
      /**
       * An extrinsic completed successfully.
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [FrameSupportWeightsDispatchInfo]>;
      /**
       * An account was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * A new account was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * On on-chain remark happened.
       **/
      Remarked: AugmentedEvent<ApiType, [AccountId32, H256]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tokens: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [u32, AccountId32, u128, u128]>;
      /**
       * Deposited some balance into an account
       **/
      Deposited: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * An account was removed whose balance was non-zero but below
       * ExistentialDeposit, resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * Some locked funds were unlocked
       **/
      LockRemoved: AugmentedEvent<ApiType, [U8aFixed, u32, AccountId32]>;
      /**
       * Some funds are locked
       **/
      LockSet: AugmentedEvent<ApiType, [U8aFixed, u32, AccountId32, u128]>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * Some reserved balance was repatriated (moved from reserved to
       * another account).
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32, u128, FrameSupportTokensMiscBalanceStatus]>;
      /**
       * Some balances were slashed (e.g. due to mis-behavior)
       **/
      Slashed: AugmentedEvent<ApiType, [u32, AccountId32, u128, u128]>;
      /**
       * The total issuance of an currency has been set
       **/
      TotalIssuanceSet: AugmentedEvent<ApiType, [u32, u128]>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<ApiType, [u32, AccountId32, AccountId32, u128]>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * Some balances were withdrawn (e.g. pay for transaction fee)
       **/
      Withdrawn: AugmentedEvent<ApiType, [u32, AccountId32, u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tokenWrapper: {
      UnwrappedToken: AugmentedEvent<ApiType, [u32, u32, u128, AccountId32]>;
      UpdatedWrappingFeePercent: AugmentedEvent<ApiType, [u32, u128]>;
      WrappedToken: AugmentedEvent<ApiType, [u32, u32, u128, AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    treasury: {
      /**
       * Some funds have been allocated.
       **/
      Awarded: AugmentedEvent<ApiType, [u32, u128, AccountId32]>;
      /**
       * Some of our funds have been burnt.
       **/
      Burnt: AugmentedEvent<ApiType, [u128]>;
      /**
       * Some funds have been deposited.
       **/
      Deposit: AugmentedEvent<ApiType, [u128]>;
      /**
       * New proposal.
       **/
      Proposed: AugmentedEvent<ApiType, [u32]>;
      /**
       * A proposal was rejected; funds were slashed.
       **/
      Rejected: AugmentedEvent<ApiType, [u32, u128]>;
      /**
       * Spending has finished; this is the amount that rolls over until next spend.
       **/
      Rollover: AugmentedEvent<ApiType, [u128]>;
      /**
       * We have ended a spend period and will now allocate funds.
       **/
      Spending: AugmentedEvent<ApiType, [u128]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches completed but has errors.
       **/
      BatchCompletedWithErrors: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error.
       **/
      BatchInterrupted: AugmentedEvent<ApiType, [u32, SpRuntimeDispatchError]>;
      /**
       * A call was dispatched.
       **/
      DispatchedAs: AugmentedEvent<ApiType, [Result<Null, SpRuntimeDispatchError>]>;
      /**
       * A single item within a Batch of dispatches has completed with no error.
       **/
      ItemCompleted: AugmentedEvent<ApiType, []>;
      /**
       * A single item within a Batch of dispatches has completed with error.
       **/
      ItemFailed: AugmentedEvent<ApiType, [SpRuntimeDispatchError]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    vAnchorBn254: {
      /**
       * Deposit hook has executed successfully
       **/
      Deposit: AugmentedEvent<ApiType, [AccountId32, u32, WebbStandaloneRuntimeElement]>;
      MaxDepositAmountChanged: AugmentedEvent<ApiType, [u128]>;
      MinWithdrawAmountChanged: AugmentedEvent<ApiType, [u128]>;
      /**
       * Transaction has been made
       **/
      Transaction: AugmentedEvent<ApiType, [AccountId32, u32, Vec<WebbStandaloneRuntimeElement>, i128]>;
      /**
       * New tree created
       **/
      VAnchorCreation: AugmentedEvent<ApiType, [u32]>;
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
