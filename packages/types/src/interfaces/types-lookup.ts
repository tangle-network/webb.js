// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

declare module '@polkadot/types/lookup' {
  import type { BTreeMap, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U8aFixed, Vec, bool, i128, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
  import type { ITuple } from '@polkadot/types-codec/types';
  import type { Vote } from '@polkadot/types/interfaces/elections';
  import type { AccountId32, Call, H256, MultiAddress, PerU16, Perbill, Percent } from '@polkadot/types/interfaces/runtime';
  import type { Event } from '@polkadot/types/interfaces/system';

  /** @name FrameSystemAccountInfo (3) */
  export interface FrameSystemAccountInfo extends Struct {
    readonly nonce: u32;
    readonly consumers: u32;
    readonly providers: u32;
    readonly sufficients: u32;
    readonly data: PalletBalancesAccountData;
  }

  /** @name PalletBalancesAccountData (5) */
  export interface PalletBalancesAccountData extends Struct {
    readonly free: u128;
    readonly reserved: u128;
    readonly miscFrozen: u128;
    readonly feeFrozen: u128;
  }

  /** @name FrameSupportWeightsPerDispatchClassU64 (7) */
  export interface FrameSupportWeightsPerDispatchClassU64 extends Struct {
    readonly normal: u64;
    readonly operational: u64;
    readonly mandatory: u64;
  }

  /** @name SpRuntimeDigest (11) */
  export interface SpRuntimeDigest extends Struct {
    readonly logs: Vec<SpRuntimeDigestDigestItem>;
  }

  /** @name SpRuntimeDigestDigestItem (13) */
  export interface SpRuntimeDigestDigestItem extends Enum {
    readonly isOther: boolean;
    readonly asOther: Bytes;
    readonly isConsensus: boolean;
    readonly asConsensus: ITuple<[U8aFixed, Bytes]>;
    readonly isSeal: boolean;
    readonly asSeal: ITuple<[U8aFixed, Bytes]>;
    readonly isPreRuntime: boolean;
    readonly asPreRuntime: ITuple<[U8aFixed, Bytes]>;
    readonly isRuntimeEnvironmentUpdated: boolean;
    readonly type: 'Other' | 'Consensus' | 'Seal' | 'PreRuntime' | 'RuntimeEnvironmentUpdated';
  }

  /** @name FrameSystemEventRecord (16) */
  export interface FrameSystemEventRecord extends Struct {
    readonly phase: FrameSystemPhase;
    readonly event: Event;
    readonly topics: Vec<H256>;
  }

  /** @name FrameSystemEvent (18) */
  export interface FrameSystemEvent extends Enum {
    readonly isExtrinsicSuccess: boolean;
    readonly asExtrinsicSuccess: {
      readonly dispatchInfo: FrameSupportWeightsDispatchInfo;
    } & Struct;
    readonly isExtrinsicFailed: boolean;
    readonly asExtrinsicFailed: {
      readonly dispatchError: SpRuntimeDispatchError;
      readonly dispatchInfo: FrameSupportWeightsDispatchInfo;
    } & Struct;
    readonly isCodeUpdated: boolean;
    readonly isNewAccount: boolean;
    readonly asNewAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isKilledAccount: boolean;
    readonly asKilledAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isRemarked: boolean;
    readonly asRemarked: {
      readonly sender: AccountId32;
      readonly hash_: H256;
    } & Struct;
    readonly type: 'ExtrinsicSuccess' | 'ExtrinsicFailed' | 'CodeUpdated' | 'NewAccount' | 'KilledAccount' | 'Remarked';
  }

  /** @name FrameSupportWeightsDispatchInfo (19) */
  export interface FrameSupportWeightsDispatchInfo extends Struct {
    readonly weight: u64;
    readonly class: FrameSupportWeightsDispatchClass;
    readonly paysFee: FrameSupportWeightsPays;
  }

  /** @name FrameSupportWeightsDispatchClass (20) */
  export interface FrameSupportWeightsDispatchClass extends Enum {
    readonly isNormal: boolean;
    readonly isOperational: boolean;
    readonly isMandatory: boolean;
    readonly type: 'Normal' | 'Operational' | 'Mandatory';
  }

  /** @name FrameSupportWeightsPays (21) */
  export interface FrameSupportWeightsPays extends Enum {
    readonly isYes: boolean;
    readonly isNo: boolean;
    readonly type: 'Yes' | 'No';
  }

  /** @name SpRuntimeDispatchError (22) */
  export interface SpRuntimeDispatchError extends Enum {
    readonly isOther: boolean;
    readonly isCannotLookup: boolean;
    readonly isBadOrigin: boolean;
    readonly isModule: boolean;
    readonly asModule: SpRuntimeModuleError;
    readonly isConsumerRemaining: boolean;
    readonly isNoProviders: boolean;
    readonly isTooManyConsumers: boolean;
    readonly isToken: boolean;
    readonly asToken: SpRuntimeTokenError;
    readonly isArithmetic: boolean;
    readonly asArithmetic: SpRuntimeArithmeticError;
    readonly type: 'Other' | 'CannotLookup' | 'BadOrigin' | 'Module' | 'ConsumerRemaining' | 'NoProviders' | 'TooManyConsumers' | 'Token' | 'Arithmetic';
  }

  /** @name SpRuntimeModuleError (23) */
  export interface SpRuntimeModuleError extends Struct {
    readonly index: u8;
    readonly error: u8;
  }

  /** @name SpRuntimeTokenError (24) */
  export interface SpRuntimeTokenError extends Enum {
    readonly isNoFunds: boolean;
    readonly isWouldDie: boolean;
    readonly isBelowMinimum: boolean;
    readonly isCannotCreate: boolean;
    readonly isUnknownAsset: boolean;
    readonly isFrozen: boolean;
    readonly isUnsupported: boolean;
    readonly type: 'NoFunds' | 'WouldDie' | 'BelowMinimum' | 'CannotCreate' | 'UnknownAsset' | 'Frozen' | 'Unsupported';
  }

  /** @name SpRuntimeArithmeticError (25) */
  export interface SpRuntimeArithmeticError extends Enum {
    readonly isUnderflow: boolean;
    readonly isOverflow: boolean;
    readonly isDivisionByZero: boolean;
    readonly type: 'Underflow' | 'Overflow' | 'DivisionByZero';
  }

  /** @name PalletSudoEvent (26) */
  export interface PalletSudoEvent extends Enum {
    readonly isSudid: boolean;
    readonly asSudid: {
      readonly sudoResult: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isKeyChanged: boolean;
    readonly asKeyChanged: {
      readonly oldSudoer: Option<AccountId32>;
    } & Struct;
    readonly isSudoAsDone: boolean;
    readonly asSudoAsDone: {
      readonly sudoResult: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly type: 'Sudid' | 'KeyChanged' | 'SudoAsDone';
  }

  /** @name PalletBalancesEvent (30) */
  export interface PalletBalancesEvent extends Enum {
    readonly isEndowed: boolean;
    readonly asEndowed: {
      readonly account: AccountId32;
      readonly freeBalance: u128;
    } & Struct;
    readonly isDustLost: boolean;
    readonly asDustLost: {
      readonly account: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBalanceSet: boolean;
    readonly asBalanceSet: {
      readonly who: AccountId32;
      readonly free: u128;
      readonly reserved: u128;
    } & Struct;
    readonly isReserved: boolean;
    readonly asReserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnreserved: boolean;
    readonly asUnreserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isReserveRepatriated: boolean;
    readonly asReserveRepatriated: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
      readonly destinationStatus: FrameSupportTokensMiscBalanceStatus;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type: 'Endowed' | 'DustLost' | 'Transfer' | 'BalanceSet' | 'Reserved' | 'Unreserved' | 'ReserveRepatriated' | 'Deposit' | 'Withdraw' | 'Slashed';
  }

  /** @name FrameSupportTokensMiscBalanceStatus (31) */
  export interface FrameSupportTokensMiscBalanceStatus extends Enum {
    readonly isFree: boolean;
    readonly isReserved: boolean;
    readonly type: 'Free' | 'Reserved';
  }

  /** @name PalletGrandpaEvent (32) */
  export interface PalletGrandpaEvent extends Enum {
    readonly isNewAuthorities: boolean;
    readonly asNewAuthorities: {
      readonly authoritySet: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>;
    } & Struct;
    readonly isPaused: boolean;
    readonly isResumed: boolean;
    readonly type: 'NewAuthorities' | 'Paused' | 'Resumed';
  }

  /** @name SpFinalityGrandpaAppPublic (35) */
  export interface SpFinalityGrandpaAppPublic extends SpCoreEd25519Public {}

  /** @name SpCoreEd25519Public (36) */
  export interface SpCoreEd25519Public extends U8aFixed {}

  /** @name PalletDemocracyEvent (37) */
  export interface PalletDemocracyEvent extends Enum {
    readonly isProposed: boolean;
    readonly asProposed: {
      readonly proposalIndex: u32;
      readonly deposit: u128;
    } & Struct;
    readonly isTabled: boolean;
    readonly asTabled: {
      readonly proposalIndex: u32;
      readonly deposit: u128;
      readonly depositors: Vec<AccountId32>;
    } & Struct;
    readonly isExternalTabled: boolean;
    readonly isStarted: boolean;
    readonly asStarted: {
      readonly refIndex: u32;
      readonly threshold: PalletDemocracyVoteThreshold;
    } & Struct;
    readonly isPassed: boolean;
    readonly asPassed: {
      readonly refIndex: u32;
    } & Struct;
    readonly isNotPassed: boolean;
    readonly asNotPassed: {
      readonly refIndex: u32;
    } & Struct;
    readonly isCancelled: boolean;
    readonly asCancelled: {
      readonly refIndex: u32;
    } & Struct;
    readonly isExecuted: boolean;
    readonly asExecuted: {
      readonly refIndex: u32;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isDelegated: boolean;
    readonly asDelegated: {
      readonly who: AccountId32;
      readonly target: AccountId32;
    } & Struct;
    readonly isUndelegated: boolean;
    readonly asUndelegated: {
      readonly account: AccountId32;
    } & Struct;
    readonly isVetoed: boolean;
    readonly asVetoed: {
      readonly who: AccountId32;
      readonly proposalHash: H256;
      readonly until: u32;
    } & Struct;
    readonly isPreimageNoted: boolean;
    readonly asPreimageNoted: {
      readonly proposalHash: H256;
      readonly who: AccountId32;
      readonly deposit: u128;
    } & Struct;
    readonly isPreimageUsed: boolean;
    readonly asPreimageUsed: {
      readonly proposalHash: H256;
      readonly provider: AccountId32;
      readonly deposit: u128;
    } & Struct;
    readonly isPreimageInvalid: boolean;
    readonly asPreimageInvalid: {
      readonly proposalHash: H256;
      readonly refIndex: u32;
    } & Struct;
    readonly isPreimageMissing: boolean;
    readonly asPreimageMissing: {
      readonly proposalHash: H256;
      readonly refIndex: u32;
    } & Struct;
    readonly isPreimageReaped: boolean;
    readonly asPreimageReaped: {
      readonly proposalHash: H256;
      readonly provider: AccountId32;
      readonly deposit: u128;
      readonly reaper: AccountId32;
    } & Struct;
    readonly isBlacklisted: boolean;
    readonly asBlacklisted: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isVoted: boolean;
    readonly asVoted: {
      readonly voter: AccountId32;
      readonly refIndex: u32;
      readonly vote: PalletDemocracyVoteAccountVote;
    } & Struct;
    readonly isSeconded: boolean;
    readonly asSeconded: {
      readonly seconder: AccountId32;
      readonly propIndex: u32;
    } & Struct;
    readonly type: 'Proposed' | 'Tabled' | 'ExternalTabled' | 'Started' | 'Passed' | 'NotPassed' | 'Cancelled' | 'Executed' | 'Delegated' | 'Undelegated' | 'Vetoed' | 'PreimageNoted' | 'PreimageUsed' | 'PreimageInvalid' | 'PreimageMissing' | 'PreimageReaped' | 'Blacklisted' | 'Voted' | 'Seconded';
  }

  /** @name PalletDemocracyVoteThreshold (39) */
  export interface PalletDemocracyVoteThreshold extends Enum {
    readonly isSuperMajorityApprove: boolean;
    readonly isSuperMajorityAgainst: boolean;
    readonly isSimpleMajority: boolean;
    readonly type: 'SuperMajorityApprove' | 'SuperMajorityAgainst' | 'SimpleMajority';
  }

  /** @name PalletDemocracyVoteAccountVote (40) */
  export interface PalletDemocracyVoteAccountVote extends Enum {
    readonly isStandard: boolean;
    readonly asStandard: {
      readonly vote: Vote;
      readonly balance: u128;
    } & Struct;
    readonly isSplit: boolean;
    readonly asSplit: {
      readonly aye: u128;
      readonly nay: u128;
    } & Struct;
    readonly type: 'Standard' | 'Split';
  }

  /** @name PalletCollectiveEvent (42) */
  export interface PalletCollectiveEvent extends Enum {
    readonly isProposed: boolean;
    readonly asProposed: {
      readonly account: AccountId32;
      readonly proposalIndex: u32;
      readonly proposalHash: H256;
      readonly threshold: u32;
    } & Struct;
    readonly isVoted: boolean;
    readonly asVoted: {
      readonly account: AccountId32;
      readonly proposalHash: H256;
      readonly voted: bool;
      readonly yes: u32;
      readonly no: u32;
    } & Struct;
    readonly isApproved: boolean;
    readonly asApproved: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isDisapproved: boolean;
    readonly asDisapproved: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isExecuted: boolean;
    readonly asExecuted: {
      readonly proposalHash: H256;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isMemberExecuted: boolean;
    readonly asMemberExecuted: {
      readonly proposalHash: H256;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isClosed: boolean;
    readonly asClosed: {
      readonly proposalHash: H256;
      readonly yes: u32;
      readonly no: u32;
    } & Struct;
    readonly type: 'Proposed' | 'Voted' | 'Approved' | 'Disapproved' | 'Executed' | 'MemberExecuted' | 'Closed';
  }

  /** @name PalletElectionsPhragmenEvent (44) */
  export interface PalletElectionsPhragmenEvent extends Enum {
    readonly isNewTerm: boolean;
    readonly asNewTerm: {
      readonly newMembers: Vec<ITuple<[AccountId32, u128]>>;
    } & Struct;
    readonly isEmptyTerm: boolean;
    readonly isElectionError: boolean;
    readonly isMemberKicked: boolean;
    readonly asMemberKicked: {
      readonly member: AccountId32;
    } & Struct;
    readonly isRenounced: boolean;
    readonly asRenounced: {
      readonly candidate: AccountId32;
    } & Struct;
    readonly isCandidateSlashed: boolean;
    readonly asCandidateSlashed: {
      readonly candidate: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSeatHolderSlashed: boolean;
    readonly asSeatHolderSlashed: {
      readonly seatHolder: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type: 'NewTerm' | 'EmptyTerm' | 'ElectionError' | 'MemberKicked' | 'Renounced' | 'CandidateSlashed' | 'SeatHolderSlashed';
  }

  /** @name PalletElectionProviderMultiPhaseEvent (47) */
  export interface PalletElectionProviderMultiPhaseEvent extends Enum {
    readonly isSolutionStored: boolean;
    readonly asSolutionStored: {
      readonly electionCompute: PalletElectionProviderMultiPhaseElectionCompute;
      readonly prevEjected: bool;
    } & Struct;
    readonly isElectionFinalized: boolean;
    readonly asElectionFinalized: {
      readonly electionCompute: Option<PalletElectionProviderMultiPhaseElectionCompute>;
    } & Struct;
    readonly isRewarded: boolean;
    readonly asRewarded: {
      readonly account: AccountId32;
      readonly value: u128;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly account: AccountId32;
      readonly value: u128;
    } & Struct;
    readonly isSignedPhaseStarted: boolean;
    readonly asSignedPhaseStarted: {
      readonly round: u32;
    } & Struct;
    readonly isUnsignedPhaseStarted: boolean;
    readonly asUnsignedPhaseStarted: {
      readonly round: u32;
    } & Struct;
    readonly type: 'SolutionStored' | 'ElectionFinalized' | 'Rewarded' | 'Slashed' | 'SignedPhaseStarted' | 'UnsignedPhaseStarted';
  }

  /** @name PalletElectionProviderMultiPhaseElectionCompute (48) */
  export interface PalletElectionProviderMultiPhaseElectionCompute extends Enum {
    readonly isOnChain: boolean;
    readonly isSigned: boolean;
    readonly isUnsigned: boolean;
    readonly isFallback: boolean;
    readonly isEmergency: boolean;
    readonly type: 'OnChain' | 'Signed' | 'Unsigned' | 'Fallback' | 'Emergency';
  }

  /** @name PalletStakingPalletEvent (50) */
  export interface PalletStakingPalletEvent extends Enum {
    readonly isEraPaid: boolean;
    readonly asEraPaid: ITuple<[u32, u128, u128]>;
    readonly isRewarded: boolean;
    readonly asRewarded: ITuple<[AccountId32, u128]>;
    readonly isSlashed: boolean;
    readonly asSlashed: ITuple<[AccountId32, u128]>;
    readonly isOldSlashingReportDiscarded: boolean;
    readonly asOldSlashingReportDiscarded: u32;
    readonly isStakersElected: boolean;
    readonly isBonded: boolean;
    readonly asBonded: ITuple<[AccountId32, u128]>;
    readonly isUnbonded: boolean;
    readonly asUnbonded: ITuple<[AccountId32, u128]>;
    readonly isWithdrawn: boolean;
    readonly asWithdrawn: ITuple<[AccountId32, u128]>;
    readonly isKicked: boolean;
    readonly asKicked: ITuple<[AccountId32, AccountId32]>;
    readonly isStakingElectionFailed: boolean;
    readonly isChilled: boolean;
    readonly asChilled: AccountId32;
    readonly isPayoutStarted: boolean;
    readonly asPayoutStarted: ITuple<[u32, AccountId32]>;
    readonly type: 'EraPaid' | 'Rewarded' | 'Slashed' | 'OldSlashingReportDiscarded' | 'StakersElected' | 'Bonded' | 'Unbonded' | 'Withdrawn' | 'Kicked' | 'StakingElectionFailed' | 'Chilled' | 'PayoutStarted';
  }

  /** @name PalletSessionEvent (51) */
  export interface PalletSessionEvent extends Enum {
    readonly isNewSession: boolean;
    readonly asNewSession: {
      readonly sessionIndex: u32;
    } & Struct;
    readonly type: 'NewSession';
  }

  /** @name PalletTreasuryEvent (52) */
  export interface PalletTreasuryEvent extends Enum {
    readonly isProposed: boolean;
    readonly asProposed: {
      readonly proposalIndex: u32;
    } & Struct;
    readonly isSpending: boolean;
    readonly asSpending: {
      readonly budgetRemaining: u128;
    } & Struct;
    readonly isAwarded: boolean;
    readonly asAwarded: {
      readonly proposalIndex: u32;
      readonly award: u128;
      readonly account: AccountId32;
    } & Struct;
    readonly isRejected: boolean;
    readonly asRejected: {
      readonly proposalIndex: u32;
      readonly slashed: u128;
    } & Struct;
    readonly isBurnt: boolean;
    readonly asBurnt: {
      readonly burntFunds: u128;
    } & Struct;
    readonly isRollover: boolean;
    readonly asRollover: {
      readonly rolloverBalance: u128;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly value: u128;
    } & Struct;
    readonly type: 'Proposed' | 'Spending' | 'Awarded' | 'Rejected' | 'Burnt' | 'Rollover' | 'Deposit';
  }

  /** @name PalletBountiesEvent (53) */
  export interface PalletBountiesEvent extends Enum {
    readonly isBountyProposed: boolean;
    readonly asBountyProposed: {
      readonly index: u32;
    } & Struct;
    readonly isBountyRejected: boolean;
    readonly asBountyRejected: {
      readonly index: u32;
      readonly bond: u128;
    } & Struct;
    readonly isBountyBecameActive: boolean;
    readonly asBountyBecameActive: {
      readonly index: u32;
    } & Struct;
    readonly isBountyAwarded: boolean;
    readonly asBountyAwarded: {
      readonly index: u32;
      readonly beneficiary: AccountId32;
    } & Struct;
    readonly isBountyClaimed: boolean;
    readonly asBountyClaimed: {
      readonly index: u32;
      readonly payout: u128;
      readonly beneficiary: AccountId32;
    } & Struct;
    readonly isBountyCanceled: boolean;
    readonly asBountyCanceled: {
      readonly index: u32;
    } & Struct;
    readonly isBountyExtended: boolean;
    readonly asBountyExtended: {
      readonly index: u32;
    } & Struct;
    readonly type: 'BountyProposed' | 'BountyRejected' | 'BountyBecameActive' | 'BountyAwarded' | 'BountyClaimed' | 'BountyCanceled' | 'BountyExtended';
  }

  /** @name PalletChildBountiesEvent (54) */
  export interface PalletChildBountiesEvent extends Enum {
    readonly isAdded: boolean;
    readonly asAdded: {
      readonly index: u32;
      readonly childIndex: u32;
    } & Struct;
    readonly isAwarded: boolean;
    readonly asAwarded: {
      readonly index: u32;
      readonly childIndex: u32;
      readonly beneficiary: AccountId32;
    } & Struct;
    readonly isClaimed: boolean;
    readonly asClaimed: {
      readonly index: u32;
      readonly childIndex: u32;
      readonly payout: u128;
      readonly beneficiary: AccountId32;
    } & Struct;
    readonly isCanceled: boolean;
    readonly asCanceled: {
      readonly index: u32;
      readonly childIndex: u32;
    } & Struct;
    readonly type: 'Added' | 'Awarded' | 'Claimed' | 'Canceled';
  }

  /** @name PalletBagsListEvent (55) */
  export interface PalletBagsListEvent extends Enum {
    readonly isRebagged: boolean;
    readonly asRebagged: {
      readonly who: AccountId32;
      readonly from: u64;
      readonly to: u64;
    } & Struct;
    readonly type: 'Rebagged';
  }

  /** @name PalletSchedulerEvent (56) */
  export interface PalletSchedulerEvent extends Enum {
    readonly isScheduled: boolean;
    readonly asScheduled: {
      readonly when: u32;
      readonly index: u32;
    } & Struct;
    readonly isCanceled: boolean;
    readonly asCanceled: {
      readonly when: u32;
      readonly index: u32;
    } & Struct;
    readonly isDispatched: boolean;
    readonly asDispatched: {
      readonly task: ITuple<[u32, u32]>;
      readonly id: Option<Bytes>;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isCallLookupFailed: boolean;
    readonly asCallLookupFailed: {
      readonly task: ITuple<[u32, u32]>;
      readonly id: Option<Bytes>;
      readonly error: FrameSupportScheduleLookupError;
    } & Struct;
    readonly type: 'Scheduled' | 'Canceled' | 'Dispatched' | 'CallLookupFailed';
  }

  /** @name FrameSupportScheduleLookupError (59) */
  export interface FrameSupportScheduleLookupError extends Enum {
    readonly isUnknown: boolean;
    readonly isBadFormat: boolean;
    readonly type: 'Unknown' | 'BadFormat';
  }

  /** @name PalletPreimageEvent (60) */
  export interface PalletPreimageEvent extends Enum {
    readonly isNoted: boolean;
    readonly asNoted: {
      readonly hash_: H256;
    } & Struct;
    readonly isRequested: boolean;
    readonly asRequested: {
      readonly hash_: H256;
    } & Struct;
    readonly isCleared: boolean;
    readonly asCleared: {
      readonly hash_: H256;
    } & Struct;
    readonly type: 'Noted' | 'Requested' | 'Cleared';
  }

  /** @name PalletOffencesEvent (61) */
  export interface PalletOffencesEvent extends Enum {
    readonly isOffence: boolean;
    readonly asOffence: {
      readonly kind: U8aFixed;
      readonly timeslot: Bytes;
    } & Struct;
    readonly type: 'Offence';
  }

  /** @name PalletDkgMetadataEvent (63) */
  export interface PalletDkgMetadataEvent extends Enum {
    readonly isPublicKeySubmitted: boolean;
    readonly asPublicKeySubmitted: {
      readonly compressedPubKey: Bytes;
      readonly uncompressedPubKey: Bytes;
    } & Struct;
    readonly isNextPublicKeySubmitted: boolean;
    readonly asNextPublicKeySubmitted: {
      readonly compressedPubKey: Bytes;
      readonly uncompressedPubKey: Bytes;
    } & Struct;
    readonly isNextPublicKeySignatureSubmitted: boolean;
    readonly asNextPublicKeySignatureSubmitted: {
      readonly pubKeySig: Bytes;
    } & Struct;
    readonly isPublicKeyChanged: boolean;
    readonly asPublicKeyChanged: {
      readonly compressedPubKey: Bytes;
      readonly uncompressedPubKey: Bytes;
    } & Struct;
    readonly isPublicKeySignatureChanged: boolean;
    readonly asPublicKeySignatureChanged: {
      readonly pubKeySig: Bytes;
    } & Struct;
    readonly isMisbehaviourReportsSubmitted: boolean;
    readonly asMisbehaviourReportsSubmitted: {
      readonly misbehaviourType: DkgRuntimePrimitivesMisbehaviourType;
      readonly reporters: Vec<DkgRuntimePrimitivesCryptoPublic>;
    } & Struct;
    readonly isRefreshKeysFinished: boolean;
    readonly asRefreshKeysFinished: {
      readonly nextAuthoritySetId: u64;
    } & Struct;
    readonly type: 'PublicKeySubmitted' | 'NextPublicKeySubmitted' | 'NextPublicKeySignatureSubmitted' | 'PublicKeyChanged' | 'PublicKeySignatureChanged' | 'MisbehaviourReportsSubmitted' | 'RefreshKeysFinished';
  }

  /** @name DkgRuntimePrimitivesMisbehaviourType (64) */
  export interface DkgRuntimePrimitivesMisbehaviourType extends Enum {
    readonly isKeygen: boolean;
    readonly isSign: boolean;
    readonly type: 'Keygen' | 'Sign';
  }

  /** @name DkgRuntimePrimitivesCryptoPublic (66) */
  export interface DkgRuntimePrimitivesCryptoPublic extends SpCoreEcdsaPublic {}

  /** @name SpCoreEcdsaPublic (67) */
  export interface SpCoreEcdsaPublic extends U8aFixed {}

  /** @name PalletDkgProposalsEvent (69) */
  export interface PalletDkgProposalsEvent extends Enum {
    readonly isProposerThresholdChanged: boolean;
    readonly asProposerThresholdChanged: {
      readonly newThreshold: u32;
    } & Struct;
    readonly isChainWhitelisted: boolean;
    readonly asChainWhitelisted: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
    } & Struct;
    readonly isProposerAdded: boolean;
    readonly asProposerAdded: {
      readonly proposerId: AccountId32;
    } & Struct;
    readonly isProposerRemoved: boolean;
    readonly asProposerRemoved: {
      readonly proposerId: AccountId32;
    } & Struct;
    readonly isVoteFor: boolean;
    readonly asVoteFor: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
      readonly proposalNonce: u32;
      readonly who: AccountId32;
    } & Struct;
    readonly isVoteAgainst: boolean;
    readonly asVoteAgainst: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
      readonly proposalNonce: u32;
      readonly who: AccountId32;
    } & Struct;
    readonly isProposalApproved: boolean;
    readonly asProposalApproved: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
      readonly proposalNonce: u32;
    } & Struct;
    readonly isProposalRejected: boolean;
    readonly asProposalRejected: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
      readonly proposalNonce: u32;
    } & Struct;
    readonly isProposalSucceeded: boolean;
    readonly asProposalSucceeded: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
      readonly proposalNonce: u32;
    } & Struct;
    readonly isProposalFailed: boolean;
    readonly asProposalFailed: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
      readonly proposalNonce: u32;
    } & Struct;
    readonly isAuthorityProposersReset: boolean;
    readonly asAuthorityProposersReset: {
      readonly proposers: Vec<AccountId32>;
    } & Struct;
    readonly type: 'ProposerThresholdChanged' | 'ChainWhitelisted' | 'ProposerAdded' | 'ProposerRemoved' | 'VoteFor' | 'VoteAgainst' | 'ProposalApproved' | 'ProposalRejected' | 'ProposalSucceeded' | 'ProposalFailed' | 'AuthorityProposersReset';
  }

  /** @name WebbProposalsHeaderTypedChainId (70) */
  export interface WebbProposalsHeaderTypedChainId extends Enum {
    readonly isNone: boolean;
    readonly isEvm: boolean;
    readonly asEvm: u32;
    readonly isSubstrate: boolean;
    readonly asSubstrate: u32;
    readonly isPolkadotParachain: boolean;
    readonly asPolkadotParachain: u32;
    readonly isKusamaParachain: boolean;
    readonly asKusamaParachain: u32;
    readonly isRococoParachain: boolean;
    readonly asRococoParachain: u32;
    readonly isCosmos: boolean;
    readonly asCosmos: u32;
    readonly isSolana: boolean;
    readonly asSolana: u32;
    readonly type: 'None' | 'Evm' | 'Substrate' | 'PolkadotParachain' | 'KusamaParachain' | 'RococoParachain' | 'Cosmos' | 'Solana';
  }

  /** @name PalletDkgProposalHandlerEvent (72) */
  export interface PalletDkgProposalHandlerEvent extends Enum {
    readonly isInvalidProposalSignature: boolean;
    readonly asInvalidProposalSignature: {
      readonly kind: DkgRuntimePrimitivesProposalProposalKind;
      readonly data: Bytes;
      readonly invalidSignature: Bytes;
    } & Struct;
    readonly isProposalSigned: boolean;
    readonly asProposalSigned: {
      readonly key: DkgRuntimePrimitivesProposalDkgPayloadKey;
      readonly targetChain: WebbProposalsHeaderTypedChainId;
      readonly data: Bytes;
      readonly signature: Bytes;
    } & Struct;
    readonly type: 'InvalidProposalSignature' | 'ProposalSigned';
  }

  /** @name DkgRuntimePrimitivesProposalProposalKind (73) */
  export interface DkgRuntimePrimitivesProposalProposalKind extends Enum {
    readonly isRefresh: boolean;
    readonly isProposerSetUpdate: boolean;
    readonly isEvm: boolean;
    readonly isAnchorCreate: boolean;
    readonly isAnchorUpdate: boolean;
    readonly isTokenAdd: boolean;
    readonly isTokenRemove: boolean;
    readonly isWrappingFeeUpdate: boolean;
    readonly isResourceIdUpdate: boolean;
    readonly isRescueTokens: boolean;
    readonly isMaxDepositLimitUpdate: boolean;
    readonly isMinWithdrawalLimitUpdate: boolean;
    readonly isSetVerifier: boolean;
    readonly isSetTreasuryHandler: boolean;
    readonly isFeeRecipientUpdate: boolean;
    readonly type: 'Refresh' | 'ProposerSetUpdate' | 'Evm' | 'AnchorCreate' | 'AnchorUpdate' | 'TokenAdd' | 'TokenRemove' | 'WrappingFeeUpdate' | 'ResourceIdUpdate' | 'RescueTokens' | 'MaxDepositLimitUpdate' | 'MinWithdrawalLimitUpdate' | 'SetVerifier' | 'SetTreasuryHandler' | 'FeeRecipientUpdate';
  }

  /** @name DkgRuntimePrimitivesProposalDkgPayloadKey (74) */
  export interface DkgRuntimePrimitivesProposalDkgPayloadKey extends Enum {
    readonly isEvmProposal: boolean;
    readonly asEvmProposal: u32;
    readonly isRefreshVote: boolean;
    readonly asRefreshVote: u32;
    readonly isProposerSetUpdateProposal: boolean;
    readonly asProposerSetUpdateProposal: u32;
    readonly isAnchorCreateProposal: boolean;
    readonly asAnchorCreateProposal: u32;
    readonly isAnchorUpdateProposal: boolean;
    readonly asAnchorUpdateProposal: u32;
    readonly isTokenAddProposal: boolean;
    readonly asTokenAddProposal: u32;
    readonly isTokenRemoveProposal: boolean;
    readonly asTokenRemoveProposal: u32;
    readonly isWrappingFeeUpdateProposal: boolean;
    readonly asWrappingFeeUpdateProposal: u32;
    readonly isResourceIdUpdateProposal: boolean;
    readonly asResourceIdUpdateProposal: u32;
    readonly isRescueTokensProposal: boolean;
    readonly asRescueTokensProposal: u32;
    readonly isMaxDepositLimitUpdateProposal: boolean;
    readonly asMaxDepositLimitUpdateProposal: u32;
    readonly isMinWithdrawalLimitUpdateProposal: boolean;
    readonly asMinWithdrawalLimitUpdateProposal: u32;
    readonly isSetVerifierProposal: boolean;
    readonly asSetVerifierProposal: u32;
    readonly isSetTreasuryHandlerProposal: boolean;
    readonly asSetTreasuryHandlerProposal: u32;
    readonly isFeeRecipientUpdateProposal: boolean;
    readonly asFeeRecipientUpdateProposal: u32;
    readonly type: 'EvmProposal' | 'RefreshVote' | 'ProposerSetUpdateProposal' | 'AnchorCreateProposal' | 'AnchorUpdateProposal' | 'TokenAddProposal' | 'TokenRemoveProposal' | 'WrappingFeeUpdateProposal' | 'ResourceIdUpdateProposal' | 'RescueTokensProposal' | 'MaxDepositLimitUpdateProposal' | 'MinWithdrawalLimitUpdateProposal' | 'SetVerifierProposal' | 'SetTreasuryHandlerProposal' | 'FeeRecipientUpdateProposal';
  }

  /** @name PalletHasherEvent (75) */
  export type PalletHasherEvent = Null;

  /** @name PalletAssetRegistryEvent (76) */
  export interface PalletAssetRegistryEvent extends Enum {
    readonly isRegistered: boolean;
    readonly asRegistered: {
      readonly assetId: u32;
      readonly name: Bytes;
      readonly assetType: PalletAssetRegistryAssetType;
    } & Struct;
    readonly isUpdated: boolean;
    readonly asUpdated: {
      readonly assetId: u32;
      readonly name: Bytes;
      readonly assetType: PalletAssetRegistryAssetType;
    } & Struct;
    readonly isMetadataSet: boolean;
    readonly asMetadataSet: {
      readonly assetId: u32;
      readonly symbol: Bytes;
      readonly decimals: u8;
    } & Struct;
    readonly isLocationSet: boolean;
    readonly asLocationSet: {
      readonly assetId: u32;
      readonly location: Null;
    } & Struct;
    readonly type: 'Registered' | 'Updated' | 'MetadataSet' | 'LocationSet';
  }

  /** @name PalletAssetRegistryAssetType (78) */
  export interface PalletAssetRegistryAssetType extends Enum {
    readonly isToken: boolean;
    readonly isPoolShare: boolean;
    readonly asPoolShare: Vec<u32>;
    readonly type: 'Token' | 'PoolShare';
  }

  /** @name OrmlCurrenciesModuleEvent (80) */
  export interface OrmlCurrenciesModuleEvent extends Enum {
    readonly isTransferred: boolean;
    readonly asTransferred: {
      readonly currencyId: u32;
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBalanceUpdated: boolean;
    readonly asBalanceUpdated: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: i128;
    } & Struct;
    readonly isDeposited: boolean;
    readonly asDeposited: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isWithdrawn: boolean;
    readonly asWithdrawn: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type: 'Transferred' | 'BalanceUpdated' | 'Deposited' | 'Withdrawn';
  }

  /** @name OrmlTokensModuleEvent (82) */
  export interface OrmlTokensModuleEvent extends Enum {
    readonly isEndowed: boolean;
    readonly asEndowed: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isDustLost: boolean;
    readonly asDustLost: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly currencyId: u32;
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isReserved: boolean;
    readonly asReserved: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnreserved: boolean;
    readonly asUnreserved: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isRepatriatedReserve: boolean;
    readonly asRepatriatedReserve: {
      readonly currencyId: u32;
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
      readonly status: FrameSupportTokensMiscBalanceStatus;
    } & Struct;
    readonly isBalanceSet: boolean;
    readonly asBalanceSet: {
      readonly currencyId: u32;
      readonly who: AccountId32;
      readonly free: u128;
      readonly reserved: u128;
    } & Struct;
    readonly type: 'Endowed' | 'DustLost' | 'Transfer' | 'Reserved' | 'Unreserved' | 'RepatriatedReserve' | 'BalanceSet';
  }

  /** @name PalletTokenWrapperEvent (83) */
  export interface PalletTokenWrapperEvent extends Enum {
    readonly isWrappedToken: boolean;
    readonly asWrappedToken: {
      readonly poolShareAsset: u32;
      readonly assetId: u32;
      readonly amount: u128;
      readonly recipient: AccountId32;
    } & Struct;
    readonly isUnwrappedToken: boolean;
    readonly asUnwrappedToken: {
      readonly poolShareAsset: u32;
      readonly assetId: u32;
      readonly amount: u128;
      readonly recipient: AccountId32;
    } & Struct;
    readonly isUpdatedWrappingFeePercent: boolean;
    readonly asUpdatedWrappingFeePercent: {
      readonly intoPoolShareId: u32;
      readonly wrappingFeePercent: u128;
    } & Struct;
    readonly type: 'WrappedToken' | 'UnwrappedToken' | 'UpdatedWrappingFeePercent';
  }

  /** @name PalletVerifierEvent (84) */
  export type PalletVerifierEvent = Null;

  /** @name PalletMtEvent (86) */
  export interface PalletMtEvent extends Enum {
    readonly isTreeCreation: boolean;
    readonly asTreeCreation: {
      readonly treeId: u32;
      readonly who: AccountId32;
    } & Struct;
    readonly isLeafInsertion: boolean;
    readonly asLeafInsertion: {
      readonly treeId: u32;
      readonly leafIndex: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly type: 'TreeCreation' | 'LeafInsertion';
  }

  /** @name EggStandaloneRuntimeProtocolSubstrateConfigElement (87) */
  export interface EggStandaloneRuntimeProtocolSubstrateConfigElement extends U8aFixed {}

  /** @name PalletLinkableTreeEvent (88) */
  export interface PalletLinkableTreeEvent extends Enum {
    readonly isLinkableTreeCreation: boolean;
    readonly asLinkableTreeCreation: {
      readonly treeId: u32;
    } & Struct;
    readonly type: 'LinkableTreeCreation';
  }

  /** @name PalletMixerEvent (89) */
  export interface PalletMixerEvent extends Enum {
    readonly isMixerCreation: boolean;
    readonly asMixerCreation: {
      readonly treeId: u32;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly treeId: u32;
      readonly recipient: AccountId32;
    } & Struct;
    readonly type: 'MixerCreation' | 'Deposit' | 'Withdraw';
  }

  /** @name PalletAnchorEvent (90) */
  export interface PalletAnchorEvent extends Enum {
    readonly isAnchorCreation: boolean;
    readonly asAnchorCreation: {
      readonly treeId: u32;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isRefresh: boolean;
    readonly asRefresh: {
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly depositor: AccountId32;
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
      readonly amount: u128;
    } & Struct;
    readonly isPostDeposit: boolean;
    readonly asPostDeposit: {
      readonly depositor: AccountId32;
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly type: 'AnchorCreation' | 'Withdraw' | 'Refresh' | 'Deposit' | 'PostDeposit';
  }

  /** @name PalletAnchorHandlerEvent (91) */
  export interface PalletAnchorHandlerEvent extends Enum {
    readonly isAnchorCreated: boolean;
    readonly isAnchorEdgeAdded: boolean;
    readonly isAnchorEdgeUpdated: boolean;
    readonly type: 'AnchorCreated' | 'AnchorEdgeAdded' | 'AnchorEdgeUpdated';
  }

  /** @name PalletSignatureBridgeEvent (92) */
  export interface PalletSignatureBridgeEvent extends Enum {
    readonly isMaintainerSet: boolean;
    readonly asMaintainerSet: {
      readonly oldMaintainer: Bytes;
      readonly newMaintainer: Bytes;
    } & Struct;
    readonly isChainWhitelisted: boolean;
    readonly asChainWhitelisted: {
      readonly chainId: u64;
    } & Struct;
    readonly isProposalApproved: boolean;
    readonly asProposalApproved: {
      readonly chainId: u64;
      readonly proposalNonce: u32;
    } & Struct;
    readonly isProposalSucceeded: boolean;
    readonly asProposalSucceeded: {
      readonly chainId: u64;
      readonly proposalNonce: u32;
    } & Struct;
    readonly isProposalFailed: boolean;
    readonly asProposalFailed: {
      readonly chainId: u64;
      readonly proposalNonce: u32;
    } & Struct;
    readonly type: 'MaintainerSet' | 'ChainWhitelisted' | 'ProposalApproved' | 'ProposalSucceeded' | 'ProposalFailed';
  }

  /** @name FrameSystemPhase (93) */
  export interface FrameSystemPhase extends Enum {
    readonly isApplyExtrinsic: boolean;
    readonly asApplyExtrinsic: u32;
    readonly isFinalization: boolean;
    readonly isInitialization: boolean;
    readonly type: 'ApplyExtrinsic' | 'Finalization' | 'Initialization';
  }

  /** @name FrameSystemLastRuntimeUpgradeInfo (96) */
  export interface FrameSystemLastRuntimeUpgradeInfo extends Struct {
    readonly specVersion: Compact<u32>;
    readonly specName: Text;
  }

  /** @name FrameSystemCall (99) */
  export interface FrameSystemCall extends Enum {
    readonly isFillBlock: boolean;
    readonly asFillBlock: {
      readonly ratio: Perbill;
    } & Struct;
    readonly isRemark: boolean;
    readonly asRemark: {
      readonly remark: Bytes;
    } & Struct;
    readonly isSetHeapPages: boolean;
    readonly asSetHeapPages: {
      readonly pages: u64;
    } & Struct;
    readonly isSetCode: boolean;
    readonly asSetCode: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetCodeWithoutChecks: boolean;
    readonly asSetCodeWithoutChecks: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetStorage: boolean;
    readonly asSetStorage: {
      readonly items: Vec<ITuple<[Bytes, Bytes]>>;
    } & Struct;
    readonly isKillStorage: boolean;
    readonly asKillStorage: {
      readonly keys_: Vec<Bytes>;
    } & Struct;
    readonly isKillPrefix: boolean;
    readonly asKillPrefix: {
      readonly prefix: Bytes;
      readonly subkeys: u32;
    } & Struct;
    readonly isRemarkWithEvent: boolean;
    readonly asRemarkWithEvent: {
      readonly remark: Bytes;
    } & Struct;
    readonly type: 'FillBlock' | 'Remark' | 'SetHeapPages' | 'SetCode' | 'SetCodeWithoutChecks' | 'SetStorage' | 'KillStorage' | 'KillPrefix' | 'RemarkWithEvent';
  }

  /** @name FrameSystemLimitsBlockWeights (104) */
  export interface FrameSystemLimitsBlockWeights extends Struct {
    readonly baseBlock: u64;
    readonly maxBlock: u64;
    readonly perClass: FrameSupportWeightsPerDispatchClassWeightsPerClass;
  }

  /** @name FrameSupportWeightsPerDispatchClassWeightsPerClass (105) */
  export interface FrameSupportWeightsPerDispatchClassWeightsPerClass extends Struct {
    readonly normal: FrameSystemLimitsWeightsPerClass;
    readonly operational: FrameSystemLimitsWeightsPerClass;
    readonly mandatory: FrameSystemLimitsWeightsPerClass;
  }

  /** @name FrameSystemLimitsWeightsPerClass (106) */
  export interface FrameSystemLimitsWeightsPerClass extends Struct {
    readonly baseExtrinsic: u64;
    readonly maxExtrinsic: Option<u64>;
    readonly maxTotal: Option<u64>;
    readonly reserved: Option<u64>;
  }

  /** @name FrameSystemLimitsBlockLength (108) */
  export interface FrameSystemLimitsBlockLength extends Struct {
    readonly max: FrameSupportWeightsPerDispatchClassU32;
  }

  /** @name FrameSupportWeightsPerDispatchClassU32 (109) */
  export interface FrameSupportWeightsPerDispatchClassU32 extends Struct {
    readonly normal: u32;
    readonly operational: u32;
    readonly mandatory: u32;
  }

  /** @name FrameSupportWeightsRuntimeDbWeight (110) */
  export interface FrameSupportWeightsRuntimeDbWeight extends Struct {
    readonly read: u64;
    readonly write: u64;
  }

  /** @name SpVersionRuntimeVersion (111) */
  export interface SpVersionRuntimeVersion extends Struct {
    readonly specName: Text;
    readonly implName: Text;
    readonly authoringVersion: u32;
    readonly specVersion: u32;
    readonly implVersion: u32;
    readonly apis: Vec<ITuple<[U8aFixed, u32]>>;
    readonly transactionVersion: u32;
    readonly stateVersion: u8;
  }

  /** @name FrameSystemError (117) */
  export interface FrameSystemError extends Enum {
    readonly isInvalidSpecName: boolean;
    readonly isSpecVersionNeedsToIncrease: boolean;
    readonly isFailedToExtractRuntimeVersion: boolean;
    readonly isNonDefaultComposite: boolean;
    readonly isNonZeroRefCount: boolean;
    readonly isCallFiltered: boolean;
    readonly type: 'InvalidSpecName' | 'SpecVersionNeedsToIncrease' | 'FailedToExtractRuntimeVersion' | 'NonDefaultComposite' | 'NonZeroRefCount' | 'CallFiltered';
  }

  /** @name PalletTimestampCall (118) */
  export interface PalletTimestampCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly now: Compact<u64>;
    } & Struct;
    readonly type: 'Set';
  }

  /** @name PalletSudoCall (120) */
  export interface PalletSudoCall extends Enum {
    readonly isSudo: boolean;
    readonly asSudo: {
      readonly call: Call;
    } & Struct;
    readonly isSudoUncheckedWeight: boolean;
    readonly asSudoUncheckedWeight: {
      readonly call: Call;
      readonly weight: u64;
    } & Struct;
    readonly isSetKey: boolean;
    readonly asSetKey: {
      readonly new_: MultiAddress;
    } & Struct;
    readonly isSudoAs: boolean;
    readonly asSudoAs: {
      readonly who: MultiAddress;
      readonly call: Call;
    } & Struct;
    readonly type: 'Sudo' | 'SudoUncheckedWeight' | 'SetKey' | 'SudoAs';
  }

  /** @name PalletBalancesCall (122) */
  export interface PalletBalancesCall extends Enum {
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isSetBalance: boolean;
    readonly asSetBalance: {
      readonly who: MultiAddress;
      readonly newFree: Compact<u128>;
      readonly newReserved: Compact<u128>;
    } & Struct;
    readonly isForceTransfer: boolean;
    readonly asForceTransfer: {
      readonly source: MultiAddress;
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferKeepAlive: boolean;
    readonly asTransferKeepAlive: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferAll: boolean;
    readonly asTransferAll: {
      readonly dest: MultiAddress;
      readonly keepAlive: bool;
    } & Struct;
    readonly isForceUnreserve: boolean;
    readonly asForceUnreserve: {
      readonly who: MultiAddress;
      readonly amount: u128;
    } & Struct;
    readonly type: 'Transfer' | 'SetBalance' | 'ForceTransfer' | 'TransferKeepAlive' | 'TransferAll' | 'ForceUnreserve';
  }

  /** @name PalletAuthorshipCall (126) */
  export interface PalletAuthorshipCall extends Enum {
    readonly isSetUncles: boolean;
    readonly asSetUncles: {
      readonly newUncles: Vec<SpRuntimeHeader>;
    } & Struct;
    readonly type: 'SetUncles';
  }

  /** @name SpRuntimeHeader (128) */
  export interface SpRuntimeHeader extends Struct {
    readonly parentHash: H256;
    readonly number: Compact<u32>;
    readonly stateRoot: H256;
    readonly extrinsicsRoot: H256;
    readonly digest: SpRuntimeDigest;
  }

  /** @name SpRuntimeBlakeTwo256 (129) */
  export type SpRuntimeBlakeTwo256 = Null;

  /** @name PalletGrandpaCall (130) */
  export interface PalletGrandpaCall extends Enum {
    readonly isReportEquivocation: boolean;
    readonly asReportEquivocation: {
      readonly equivocationProof: SpFinalityGrandpaEquivocationProof;
      readonly keyOwnerProof: SpSessionMembershipProof;
    } & Struct;
    readonly isReportEquivocationUnsigned: boolean;
    readonly asReportEquivocationUnsigned: {
      readonly equivocationProof: SpFinalityGrandpaEquivocationProof;
      readonly keyOwnerProof: SpSessionMembershipProof;
    } & Struct;
    readonly isNoteStalled: boolean;
    readonly asNoteStalled: {
      readonly delay: u32;
      readonly bestFinalizedBlockNumber: u32;
    } & Struct;
    readonly type: 'ReportEquivocation' | 'ReportEquivocationUnsigned' | 'NoteStalled';
  }

  /** @name SpFinalityGrandpaEquivocationProof (131) */
  export interface SpFinalityGrandpaEquivocationProof extends Struct {
    readonly setId: u64;
    readonly equivocation: SpFinalityGrandpaEquivocation;
  }

  /** @name SpFinalityGrandpaEquivocation (132) */
  export interface SpFinalityGrandpaEquivocation extends Enum {
    readonly isPrevote: boolean;
    readonly asPrevote: FinalityGrandpaEquivocationPrevote;
    readonly isPrecommit: boolean;
    readonly asPrecommit: FinalityGrandpaEquivocationPrecommit;
    readonly type: 'Prevote' | 'Precommit';
  }

  /** @name FinalityGrandpaEquivocationPrevote (133) */
  export interface FinalityGrandpaEquivocationPrevote extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpFinalityGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrevote, SpFinalityGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrevote, SpFinalityGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrevote (134) */
  export interface FinalityGrandpaPrevote extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u32;
  }

  /** @name SpFinalityGrandpaAppSignature (135) */
  export interface SpFinalityGrandpaAppSignature extends SpCoreEd25519Signature {}

  /** @name SpCoreEd25519Signature (136) */
  export interface SpCoreEd25519Signature extends U8aFixed {}

  /** @name FinalityGrandpaEquivocationPrecommit (139) */
  export interface FinalityGrandpaEquivocationPrecommit extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpFinalityGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrecommit, SpFinalityGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrecommit, SpFinalityGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrecommit (140) */
  export interface FinalityGrandpaPrecommit extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u32;
  }

  /** @name SpSessionMembershipProof (142) */
  export interface SpSessionMembershipProof extends Struct {
    readonly session: u32;
    readonly trieNodes: Vec<Bytes>;
    readonly validatorCount: u32;
  }

  /** @name PalletDemocracyCall (143) */
  export interface PalletDemocracyCall extends Enum {
    readonly isPropose: boolean;
    readonly asPropose: {
      readonly proposalHash: H256;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isSecond: boolean;
    readonly asSecond: {
      readonly proposal: Compact<u32>;
      readonly secondsUpperBound: Compact<u32>;
    } & Struct;
    readonly isVote: boolean;
    readonly asVote: {
      readonly refIndex: Compact<u32>;
      readonly vote: PalletDemocracyVoteAccountVote;
    } & Struct;
    readonly isEmergencyCancel: boolean;
    readonly asEmergencyCancel: {
      readonly refIndex: u32;
    } & Struct;
    readonly isExternalPropose: boolean;
    readonly asExternalPropose: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isExternalProposeMajority: boolean;
    readonly asExternalProposeMajority: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isExternalProposeDefault: boolean;
    readonly asExternalProposeDefault: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isFastTrack: boolean;
    readonly asFastTrack: {
      readonly proposalHash: H256;
      readonly votingPeriod: u32;
      readonly delay: u32;
    } & Struct;
    readonly isVetoExternal: boolean;
    readonly asVetoExternal: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isCancelReferendum: boolean;
    readonly asCancelReferendum: {
      readonly refIndex: Compact<u32>;
    } & Struct;
    readonly isCancelQueued: boolean;
    readonly asCancelQueued: {
      readonly which: u32;
    } & Struct;
    readonly isDelegate: boolean;
    readonly asDelegate: {
      readonly to: AccountId32;
      readonly conviction: PalletDemocracyConviction;
      readonly balance: u128;
    } & Struct;
    readonly isUndelegate: boolean;
    readonly isClearPublicProposals: boolean;
    readonly isNotePreimage: boolean;
    readonly asNotePreimage: {
      readonly encodedProposal: Bytes;
    } & Struct;
    readonly isNotePreimageOperational: boolean;
    readonly asNotePreimageOperational: {
      readonly encodedProposal: Bytes;
    } & Struct;
    readonly isNoteImminentPreimage: boolean;
    readonly asNoteImminentPreimage: {
      readonly encodedProposal: Bytes;
    } & Struct;
    readonly isNoteImminentPreimageOperational: boolean;
    readonly asNoteImminentPreimageOperational: {
      readonly encodedProposal: Bytes;
    } & Struct;
    readonly isReapPreimage: boolean;
    readonly asReapPreimage: {
      readonly proposalHash: H256;
      readonly proposalLenUpperBound: Compact<u32>;
    } & Struct;
    readonly isUnlock: boolean;
    readonly asUnlock: {
      readonly target: AccountId32;
    } & Struct;
    readonly isRemoveVote: boolean;
    readonly asRemoveVote: {
      readonly index: u32;
    } & Struct;
    readonly isRemoveOtherVote: boolean;
    readonly asRemoveOtherVote: {
      readonly target: AccountId32;
      readonly index: u32;
    } & Struct;
    readonly isEnactProposal: boolean;
    readonly asEnactProposal: {
      readonly proposalHash: H256;
      readonly index: u32;
    } & Struct;
    readonly isBlacklist: boolean;
    readonly asBlacklist: {
      readonly proposalHash: H256;
      readonly maybeRefIndex: Option<u32>;
    } & Struct;
    readonly isCancelProposal: boolean;
    readonly asCancelProposal: {
      readonly propIndex: Compact<u32>;
    } & Struct;
    readonly type: 'Propose' | 'Second' | 'Vote' | 'EmergencyCancel' | 'ExternalPropose' | 'ExternalProposeMajority' | 'ExternalProposeDefault' | 'FastTrack' | 'VetoExternal' | 'CancelReferendum' | 'CancelQueued' | 'Delegate' | 'Undelegate' | 'ClearPublicProposals' | 'NotePreimage' | 'NotePreimageOperational' | 'NoteImminentPreimage' | 'NoteImminentPreimageOperational' | 'ReapPreimage' | 'Unlock' | 'RemoveVote' | 'RemoveOtherVote' | 'EnactProposal' | 'Blacklist' | 'CancelProposal';
  }

  /** @name PalletDemocracyConviction (144) */
  export interface PalletDemocracyConviction extends Enum {
    readonly isNone: boolean;
    readonly isLocked1x: boolean;
    readonly isLocked2x: boolean;
    readonly isLocked3x: boolean;
    readonly isLocked4x: boolean;
    readonly isLocked5x: boolean;
    readonly isLocked6x: boolean;
    readonly type: 'None' | 'Locked1x' | 'Locked2x' | 'Locked3x' | 'Locked4x' | 'Locked5x' | 'Locked6x';
  }

  /** @name PalletCollectiveCall (146) */
  export interface PalletCollectiveCall extends Enum {
    readonly isSetMembers: boolean;
    readonly asSetMembers: {
      readonly newMembers: Vec<AccountId32>;
      readonly prime: Option<AccountId32>;
      readonly oldCount: u32;
    } & Struct;
    readonly isExecute: boolean;
    readonly asExecute: {
      readonly proposal: Call;
      readonly lengthBound: Compact<u32>;
    } & Struct;
    readonly isPropose: boolean;
    readonly asPropose: {
      readonly threshold: Compact<u32>;
      readonly proposal: Call;
      readonly lengthBound: Compact<u32>;
    } & Struct;
    readonly isVote: boolean;
    readonly asVote: {
      readonly proposal: H256;
      readonly index: Compact<u32>;
      readonly approve: bool;
    } & Struct;
    readonly isClose: boolean;
    readonly asClose: {
      readonly proposalHash: H256;
      readonly index: Compact<u32>;
      readonly proposalWeightBound: Compact<u64>;
      readonly lengthBound: Compact<u32>;
    } & Struct;
    readonly isDisapproveProposal: boolean;
    readonly asDisapproveProposal: {
      readonly proposalHash: H256;
    } & Struct;
    readonly type: 'SetMembers' | 'Execute' | 'Propose' | 'Vote' | 'Close' | 'DisapproveProposal';
  }

  /** @name PalletElectionsPhragmenCall (147) */
  export interface PalletElectionsPhragmenCall extends Enum {
    readonly isVote: boolean;
    readonly asVote: {
      readonly votes: Vec<AccountId32>;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isRemoveVoter: boolean;
    readonly isSubmitCandidacy: boolean;
    readonly asSubmitCandidacy: {
      readonly candidateCount: Compact<u32>;
    } & Struct;
    readonly isRenounceCandidacy: boolean;
    readonly asRenounceCandidacy: {
      readonly renouncing: PalletElectionsPhragmenRenouncing;
    } & Struct;
    readonly isRemoveMember: boolean;
    readonly asRemoveMember: {
      readonly who: MultiAddress;
      readonly hasReplacement: bool;
    } & Struct;
    readonly isCleanDefunctVoters: boolean;
    readonly asCleanDefunctVoters: {
      readonly numVoters: u32;
      readonly numDefunct: u32;
    } & Struct;
    readonly type: 'Vote' | 'RemoveVoter' | 'SubmitCandidacy' | 'RenounceCandidacy' | 'RemoveMember' | 'CleanDefunctVoters';
  }

  /** @name PalletElectionsPhragmenRenouncing (148) */
  export interface PalletElectionsPhragmenRenouncing extends Enum {
    readonly isMember: boolean;
    readonly isRunnerUp: boolean;
    readonly isCandidate: boolean;
    readonly asCandidate: Compact<u32>;
    readonly type: 'Member' | 'RunnerUp' | 'Candidate';
  }

  /** @name PalletElectionProviderMultiPhaseCall (149) */
  export interface PalletElectionProviderMultiPhaseCall extends Enum {
    readonly isSubmitUnsigned: boolean;
    readonly asSubmitUnsigned: {
      readonly rawSolution: PalletElectionProviderMultiPhaseRawSolution;
      readonly witness: PalletElectionProviderMultiPhaseSolutionOrSnapshotSize;
    } & Struct;
    readonly isSetMinimumUntrustedScore: boolean;
    readonly asSetMinimumUntrustedScore: {
      readonly maybeNextScore: Option<Vec<u128>>;
    } & Struct;
    readonly isSetEmergencyElectionResult: boolean;
    readonly asSetEmergencyElectionResult: {
      readonly supports: Vec<ITuple<[AccountId32, SpNposElectionsSupport]>>;
    } & Struct;
    readonly isSubmit: boolean;
    readonly asSubmit: {
      readonly rawSolution: PalletElectionProviderMultiPhaseRawSolution;
      readonly numSignedSubmissions: u32;
    } & Struct;
    readonly isGovernanceFallback: boolean;
    readonly asGovernanceFallback: {
      readonly maybeMaxVoters: Option<u32>;
      readonly maybeMaxTargets: Option<u32>;
    } & Struct;
    readonly type: 'SubmitUnsigned' | 'SetMinimumUntrustedScore' | 'SetEmergencyElectionResult' | 'Submit' | 'GovernanceFallback';
  }

  /** @name PalletElectionProviderMultiPhaseRawSolution (150) */
  export interface PalletElectionProviderMultiPhaseRawSolution extends Struct {
    readonly solution: EggStandaloneRuntimeNposSolution16;
    readonly score: Vec<u128>;
    readonly round: u32;
  }

  /** @name EggStandaloneRuntimeNposSolution16 (151) */
  export interface EggStandaloneRuntimeNposSolution16 extends Struct {
    readonly votes1: Vec<ITuple<[Compact<u32>, Compact<u16>]>>;
    readonly votes2: Vec<ITuple<[Compact<u32>, ITuple<[Compact<u16>, Compact<PerU16>]>, Compact<u16>]>>;
    readonly votes3: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes4: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes5: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes6: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes7: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes8: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes9: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes10: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes11: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes12: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes13: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes14: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes15: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes16: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
  }

  /** @name PalletElectionProviderMultiPhaseSolutionOrSnapshotSize (203) */
  export interface PalletElectionProviderMultiPhaseSolutionOrSnapshotSize extends Struct {
    readonly voters: Compact<u32>;
    readonly targets: Compact<u32>;
  }

  /** @name SpNposElectionsSupport (207) */
  export interface SpNposElectionsSupport extends Struct {
    readonly total: u128;
    readonly voters: Vec<ITuple<[AccountId32, u128]>>;
  }

  /** @name PalletStakingPalletCall (208) */
  export interface PalletStakingPalletCall extends Enum {
    readonly isBond: boolean;
    readonly asBond: {
      readonly controller: MultiAddress;
      readonly value: Compact<u128>;
      readonly payee: PalletStakingRewardDestination;
    } & Struct;
    readonly isBondExtra: boolean;
    readonly asBondExtra: {
      readonly maxAdditional: Compact<u128>;
    } & Struct;
    readonly isUnbond: boolean;
    readonly asUnbond: {
      readonly value: Compact<u128>;
    } & Struct;
    readonly isWithdrawUnbonded: boolean;
    readonly asWithdrawUnbonded: {
      readonly numSlashingSpans: u32;
    } & Struct;
    readonly isValidate: boolean;
    readonly asValidate: {
      readonly prefs: PalletStakingValidatorPrefs;
    } & Struct;
    readonly isNominate: boolean;
    readonly asNominate: {
      readonly targets: Vec<MultiAddress>;
    } & Struct;
    readonly isChill: boolean;
    readonly isSetPayee: boolean;
    readonly asSetPayee: {
      readonly payee: PalletStakingRewardDestination;
    } & Struct;
    readonly isSetController: boolean;
    readonly asSetController: {
      readonly controller: MultiAddress;
    } & Struct;
    readonly isSetValidatorCount: boolean;
    readonly asSetValidatorCount: {
      readonly new_: Compact<u32>;
    } & Struct;
    readonly isIncreaseValidatorCount: boolean;
    readonly asIncreaseValidatorCount: {
      readonly additional: Compact<u32>;
    } & Struct;
    readonly isScaleValidatorCount: boolean;
    readonly asScaleValidatorCount: {
      readonly factor: Percent;
    } & Struct;
    readonly isForceNoEras: boolean;
    readonly isForceNewEra: boolean;
    readonly isSetInvulnerables: boolean;
    readonly asSetInvulnerables: {
      readonly invulnerables: Vec<AccountId32>;
    } & Struct;
    readonly isForceUnstake: boolean;
    readonly asForceUnstake: {
      readonly stash: AccountId32;
      readonly numSlashingSpans: u32;
    } & Struct;
    readonly isForceNewEraAlways: boolean;
    readonly isCancelDeferredSlash: boolean;
    readonly asCancelDeferredSlash: {
      readonly era: u32;
      readonly slashIndices: Vec<u32>;
    } & Struct;
    readonly isPayoutStakers: boolean;
    readonly asPayoutStakers: {
      readonly validatorStash: AccountId32;
      readonly era: u32;
    } & Struct;
    readonly isRebond: boolean;
    readonly asRebond: {
      readonly value: Compact<u128>;
    } & Struct;
    readonly isSetHistoryDepth: boolean;
    readonly asSetHistoryDepth: {
      readonly newHistoryDepth: Compact<u32>;
      readonly eraItemsDeleted: Compact<u32>;
    } & Struct;
    readonly isReapStash: boolean;
    readonly asReapStash: {
      readonly stash: AccountId32;
      readonly numSlashingSpans: u32;
    } & Struct;
    readonly isKick: boolean;
    readonly asKick: {
      readonly who: Vec<MultiAddress>;
    } & Struct;
    readonly isSetStakingConfigs: boolean;
    readonly asSetStakingConfigs: {
      readonly minNominatorBond: u128;
      readonly minValidatorBond: u128;
      readonly maxNominatorCount: Option<u32>;
      readonly maxValidatorCount: Option<u32>;
      readonly chillThreshold: Option<Percent>;
      readonly minCommission: Perbill;
    } & Struct;
    readonly isChillOther: boolean;
    readonly asChillOther: {
      readonly controller: AccountId32;
    } & Struct;
    readonly isForceApplyMinCommission: boolean;
    readonly asForceApplyMinCommission: {
      readonly validatorStash: AccountId32;
    } & Struct;
    readonly type: 'Bond' | 'BondExtra' | 'Unbond' | 'WithdrawUnbonded' | 'Validate' | 'Nominate' | 'Chill' | 'SetPayee' | 'SetController' | 'SetValidatorCount' | 'IncreaseValidatorCount' | 'ScaleValidatorCount' | 'ForceNoEras' | 'ForceNewEra' | 'SetInvulnerables' | 'ForceUnstake' | 'ForceNewEraAlways' | 'CancelDeferredSlash' | 'PayoutStakers' | 'Rebond' | 'SetHistoryDepth' | 'ReapStash' | 'Kick' | 'SetStakingConfigs' | 'ChillOther' | 'ForceApplyMinCommission';
  }

  /** @name PalletStakingRewardDestination (209) */
  export interface PalletStakingRewardDestination extends Enum {
    readonly isStaked: boolean;
    readonly isStash: boolean;
    readonly isController: boolean;
    readonly isAccount: boolean;
    readonly asAccount: AccountId32;
    readonly isNone: boolean;
    readonly type: 'Staked' | 'Stash' | 'Controller' | 'Account' | 'None';
  }

  /** @name PalletStakingValidatorPrefs (210) */
  export interface PalletStakingValidatorPrefs extends Struct {
    readonly commission: Compact<Perbill>;
    readonly blocked: bool;
  }

  /** @name PalletSessionCall (215) */
  export interface PalletSessionCall extends Enum {
    readonly isSetKeys: boolean;
    readonly asSetKeys: {
      readonly keys_: EggStandaloneRuntimeOpaqueSessionKeys;
      readonly proof: Bytes;
    } & Struct;
    readonly isPurgeKeys: boolean;
    readonly type: 'SetKeys' | 'PurgeKeys';
  }

  /** @name EggStandaloneRuntimeOpaqueSessionKeys (216) */
  export interface EggStandaloneRuntimeOpaqueSessionKeys extends Struct {
    readonly aura: SpConsensusAuraSr25519AppSr25519Public;
    readonly grandpa: SpFinalityGrandpaAppPublic;
    readonly dkg: DkgRuntimePrimitivesCryptoPublic;
  }

  /** @name SpConsensusAuraSr25519AppSr25519Public (217) */
  export interface SpConsensusAuraSr25519AppSr25519Public extends SpCoreSr25519Public {}

  /** @name SpCoreSr25519Public (218) */
  export interface SpCoreSr25519Public extends U8aFixed {}

  /** @name PalletTreasuryCall (219) */
  export interface PalletTreasuryCall extends Enum {
    readonly isProposeSpend: boolean;
    readonly asProposeSpend: {
      readonly value: Compact<u128>;
      readonly beneficiary: MultiAddress;
    } & Struct;
    readonly isRejectProposal: boolean;
    readonly asRejectProposal: {
      readonly proposalId: Compact<u32>;
    } & Struct;
    readonly isApproveProposal: boolean;
    readonly asApproveProposal: {
      readonly proposalId: Compact<u32>;
    } & Struct;
    readonly type: 'ProposeSpend' | 'RejectProposal' | 'ApproveProposal';
  }

  /** @name PalletBountiesCall (220) */
  export interface PalletBountiesCall extends Enum {
    readonly isProposeBounty: boolean;
    readonly asProposeBounty: {
      readonly value: Compact<u128>;
      readonly description: Bytes;
    } & Struct;
    readonly isApproveBounty: boolean;
    readonly asApproveBounty: {
      readonly bountyId: Compact<u32>;
    } & Struct;
    readonly isProposeCurator: boolean;
    readonly asProposeCurator: {
      readonly bountyId: Compact<u32>;
      readonly curator: MultiAddress;
      readonly fee: Compact<u128>;
    } & Struct;
    readonly isUnassignCurator: boolean;
    readonly asUnassignCurator: {
      readonly bountyId: Compact<u32>;
    } & Struct;
    readonly isAcceptCurator: boolean;
    readonly asAcceptCurator: {
      readonly bountyId: Compact<u32>;
    } & Struct;
    readonly isAwardBounty: boolean;
    readonly asAwardBounty: {
      readonly bountyId: Compact<u32>;
      readonly beneficiary: MultiAddress;
    } & Struct;
    readonly isClaimBounty: boolean;
    readonly asClaimBounty: {
      readonly bountyId: Compact<u32>;
    } & Struct;
    readonly isCloseBounty: boolean;
    readonly asCloseBounty: {
      readonly bountyId: Compact<u32>;
    } & Struct;
    readonly isExtendBountyExpiry: boolean;
    readonly asExtendBountyExpiry: {
      readonly bountyId: Compact<u32>;
      readonly remark: Bytes;
    } & Struct;
    readonly type: 'ProposeBounty' | 'ApproveBounty' | 'ProposeCurator' | 'UnassignCurator' | 'AcceptCurator' | 'AwardBounty' | 'ClaimBounty' | 'CloseBounty' | 'ExtendBountyExpiry';
  }

  /** @name PalletChildBountiesCall (221) */
  export interface PalletChildBountiesCall extends Enum {
    readonly isAddChildBounty: boolean;
    readonly asAddChildBounty: {
      readonly parentBountyId: Compact<u32>;
      readonly value: Compact<u128>;
      readonly description: Bytes;
    } & Struct;
    readonly isProposeCurator: boolean;
    readonly asProposeCurator: {
      readonly parentBountyId: Compact<u32>;
      readonly childBountyId: Compact<u32>;
      readonly curator: MultiAddress;
      readonly fee: Compact<u128>;
    } & Struct;
    readonly isAcceptCurator: boolean;
    readonly asAcceptCurator: {
      readonly parentBountyId: Compact<u32>;
      readonly childBountyId: Compact<u32>;
    } & Struct;
    readonly isUnassignCurator: boolean;
    readonly asUnassignCurator: {
      readonly parentBountyId: Compact<u32>;
      readonly childBountyId: Compact<u32>;
    } & Struct;
    readonly isAwardChildBounty: boolean;
    readonly asAwardChildBounty: {
      readonly parentBountyId: Compact<u32>;
      readonly childBountyId: Compact<u32>;
      readonly beneficiary: MultiAddress;
    } & Struct;
    readonly isClaimChildBounty: boolean;
    readonly asClaimChildBounty: {
      readonly parentBountyId: Compact<u32>;
      readonly childBountyId: Compact<u32>;
    } & Struct;
    readonly isCloseChildBounty: boolean;
    readonly asCloseChildBounty: {
      readonly parentBountyId: Compact<u32>;
      readonly childBountyId: Compact<u32>;
    } & Struct;
    readonly type: 'AddChildBounty' | 'ProposeCurator' | 'AcceptCurator' | 'UnassignCurator' | 'AwardChildBounty' | 'ClaimChildBounty' | 'CloseChildBounty';
  }

  /** @name PalletBagsListCall (222) */
  export interface PalletBagsListCall extends Enum {
    readonly isRebag: boolean;
    readonly asRebag: {
      readonly dislocated: AccountId32;
    } & Struct;
    readonly isPutInFrontOf: boolean;
    readonly asPutInFrontOf: {
      readonly lighter: AccountId32;
    } & Struct;
    readonly type: 'Rebag' | 'PutInFrontOf';
  }

  /** @name PalletSchedulerCall (223) */
  export interface PalletSchedulerCall extends Enum {
    readonly isSchedule: boolean;
    readonly asSchedule: {
      readonly when: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: FrameSupportScheduleMaybeHashed;
    } & Struct;
    readonly isCancel: boolean;
    readonly asCancel: {
      readonly when: u32;
      readonly index: u32;
    } & Struct;
    readonly isScheduleNamed: boolean;
    readonly asScheduleNamed: {
      readonly id: Bytes;
      readonly when: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: FrameSupportScheduleMaybeHashed;
    } & Struct;
    readonly isCancelNamed: boolean;
    readonly asCancelNamed: {
      readonly id: Bytes;
    } & Struct;
    readonly isScheduleAfter: boolean;
    readonly asScheduleAfter: {
      readonly after: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: FrameSupportScheduleMaybeHashed;
    } & Struct;
    readonly isScheduleNamedAfter: boolean;
    readonly asScheduleNamedAfter: {
      readonly id: Bytes;
      readonly after: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: FrameSupportScheduleMaybeHashed;
    } & Struct;
    readonly type: 'Schedule' | 'Cancel' | 'ScheduleNamed' | 'CancelNamed' | 'ScheduleAfter' | 'ScheduleNamedAfter';
  }

  /** @name FrameSupportScheduleMaybeHashed (225) */
  export interface FrameSupportScheduleMaybeHashed extends Enum {
    readonly isValue: boolean;
    readonly asValue: Call;
    readonly isHash: boolean;
    readonly asHash: H256;
    readonly type: 'Value' | 'Hash';
  }

  /** @name PalletPreimageCall (226) */
  export interface PalletPreimageCall extends Enum {
    readonly isNotePreimage: boolean;
    readonly asNotePreimage: {
      readonly bytes: Bytes;
    } & Struct;
    readonly isUnnotePreimage: boolean;
    readonly asUnnotePreimage: {
      readonly hash_: H256;
    } & Struct;
    readonly isRequestPreimage: boolean;
    readonly asRequestPreimage: {
      readonly hash_: H256;
    } & Struct;
    readonly isUnrequestPreimage: boolean;
    readonly asUnrequestPreimage: {
      readonly hash_: H256;
    } & Struct;
    readonly type: 'NotePreimage' | 'UnnotePreimage' | 'RequestPreimage' | 'UnrequestPreimage';
  }

  /** @name PalletDkgMetadataCall (227) */
  export interface PalletDkgMetadataCall extends Enum {
    readonly isSetSignatureThreshold: boolean;
    readonly asSetSignatureThreshold: {
      readonly newThreshold: u16;
    } & Struct;
    readonly isSetKeygenThreshold: boolean;
    readonly asSetKeygenThreshold: {
      readonly newThreshold: u16;
    } & Struct;
    readonly isSetRefreshDelay: boolean;
    readonly asSetRefreshDelay: {
      readonly newDelay: u8;
    } & Struct;
    readonly isSubmitPublicKey: boolean;
    readonly asSubmitPublicKey: {
      readonly keysAndSignatures: DkgRuntimePrimitivesAggregatedPublicKeys;
    } & Struct;
    readonly isSubmitNextPublicKey: boolean;
    readonly asSubmitNextPublicKey: {
      readonly keysAndSignatures: DkgRuntimePrimitivesAggregatedPublicKeys;
    } & Struct;
    readonly isSubmitPublicKeySignature: boolean;
    readonly asSubmitPublicKeySignature: {
      readonly signatureProposal: DkgRuntimePrimitivesProposalRefreshProposalSigned;
    } & Struct;
    readonly isSubmitMisbehaviourReports: boolean;
    readonly asSubmitMisbehaviourReports: {
      readonly reports: DkgRuntimePrimitivesAggregatedMisbehaviourReports;
    } & Struct;
    readonly isUnjail: boolean;
    readonly isForceUnjailKeygen: boolean;
    readonly asForceUnjailKeygen: {
      readonly authority: DkgRuntimePrimitivesCryptoPublic;
    } & Struct;
    readonly isForceUnjailSigning: boolean;
    readonly asForceUnjailSigning: {
      readonly authority: DkgRuntimePrimitivesCryptoPublic;
    } & Struct;
    readonly isManualIncrementNonce: boolean;
    readonly isManualRefresh: boolean;
    readonly isForceChangeAuthorities: boolean;
    readonly type: 'SetSignatureThreshold' | 'SetKeygenThreshold' | 'SetRefreshDelay' | 'SubmitPublicKey' | 'SubmitNextPublicKey' | 'SubmitPublicKeySignature' | 'SubmitMisbehaviourReports' | 'Unjail' | 'ForceUnjailKeygen' | 'ForceUnjailSigning' | 'ManualIncrementNonce' | 'ManualRefresh' | 'ForceChangeAuthorities';
  }

  /** @name DkgRuntimePrimitivesAggregatedPublicKeys (228) */
  export interface DkgRuntimePrimitivesAggregatedPublicKeys extends Struct {
    readonly keysAndSignatures: Vec<ITuple<[Bytes, Bytes]>>;
  }

  /** @name DkgRuntimePrimitivesProposalRefreshProposalSigned (229) */
  export interface DkgRuntimePrimitivesProposalRefreshProposalSigned extends Struct {
    readonly nonce: u32;
    readonly signature: Bytes;
  }

  /** @name DkgRuntimePrimitivesAggregatedMisbehaviourReports (230) */
  export interface DkgRuntimePrimitivesAggregatedMisbehaviourReports extends Struct {
    readonly misbehaviourType: DkgRuntimePrimitivesMisbehaviourType;
    readonly roundId: u64;
    readonly offender: DkgRuntimePrimitivesCryptoPublic;
    readonly reporters: Vec<DkgRuntimePrimitivesCryptoPublic>;
    readonly signatures: Vec<Bytes>;
  }

  /** @name PalletDkgProposalsCall (231) */
  export interface PalletDkgProposalsCall extends Enum {
    readonly isSetThreshold: boolean;
    readonly asSetThreshold: {
      readonly threshold: u32;
    } & Struct;
    readonly isSetResource: boolean;
    readonly asSetResource: {
      readonly id: WebbProposalsHeaderResourceId;
      readonly method: Bytes;
    } & Struct;
    readonly isRemoveResource: boolean;
    readonly asRemoveResource: {
      readonly id: WebbProposalsHeaderResourceId;
    } & Struct;
    readonly isWhitelistChain: boolean;
    readonly asWhitelistChain: {
      readonly chainId: WebbProposalsHeaderTypedChainId;
    } & Struct;
    readonly isAddProposer: boolean;
    readonly asAddProposer: {
      readonly nativeAccount: AccountId32;
      readonly externalAccount: Bytes;
    } & Struct;
    readonly isRemoveProposer: boolean;
    readonly asRemoveProposer: {
      readonly v: AccountId32;
    } & Struct;
    readonly isAcknowledgeProposal: boolean;
    readonly asAcknowledgeProposal: {
      readonly nonce: u32;
      readonly srcChainId: WebbProposalsHeaderTypedChainId;
      readonly rId: WebbProposalsHeaderResourceId;
      readonly prop: Bytes;
    } & Struct;
    readonly isRejectProposal: boolean;
    readonly asRejectProposal: {
      readonly nonce: u32;
      readonly srcChainId: WebbProposalsHeaderTypedChainId;
      readonly rId: WebbProposalsHeaderResourceId;
      readonly prop: Bytes;
    } & Struct;
    readonly isEvalVoteState: boolean;
    readonly asEvalVoteState: {
      readonly nonce: u32;
      readonly srcChainId: WebbProposalsHeaderTypedChainId;
      readonly prop: Bytes;
    } & Struct;
    readonly type: 'SetThreshold' | 'SetResource' | 'RemoveResource' | 'WhitelistChain' | 'AddProposer' | 'RemoveProposer' | 'AcknowledgeProposal' | 'RejectProposal' | 'EvalVoteState';
  }

  /** @name WebbProposalsHeaderResourceId (232) */
  export interface WebbProposalsHeaderResourceId extends U8aFixed {}

  /** @name PalletDkgProposalHandlerCall (233) */
  export interface PalletDkgProposalHandlerCall extends Enum {
    readonly isSubmitSignedProposals: boolean;
    readonly asSubmitSignedProposals: {
      readonly props: Vec<DkgRuntimePrimitivesProposal>;
    } & Struct;
    readonly isForceSubmitUnsignedProposal: boolean;
    readonly asForceSubmitUnsignedProposal: {
      readonly prop: DkgRuntimePrimitivesProposal;
    } & Struct;
    readonly type: 'SubmitSignedProposals' | 'ForceSubmitUnsignedProposal';
  }

  /** @name DkgRuntimePrimitivesProposal (235) */
  export interface DkgRuntimePrimitivesProposal extends Enum {
    readonly isSigned: boolean;
    readonly asSigned: {
      readonly kind: DkgRuntimePrimitivesProposalProposalKind;
      readonly data: Bytes;
      readonly signature: Bytes;
    } & Struct;
    readonly isUnsigned: boolean;
    readonly asUnsigned: {
      readonly kind: DkgRuntimePrimitivesProposalProposalKind;
      readonly data: Bytes;
    } & Struct;
    readonly type: 'Signed' | 'Unsigned';
  }

  /** @name PalletHasherCall (236) */
  export interface PalletHasherCall extends Enum {
    readonly isForceSetParameters: boolean;
    readonly asForceSetParameters: {
      readonly parameters: Bytes;
    } & Struct;
    readonly type: 'ForceSetParameters';
  }

  /** @name PalletAssetRegistryCall (237) */
  export interface PalletAssetRegistryCall extends Enum {
    readonly isRegister: boolean;
    readonly asRegister: {
      readonly name: Bytes;
      readonly assetType: PalletAssetRegistryAssetType;
      readonly existentialDeposit: u128;
    } & Struct;
    readonly isUpdate: boolean;
    readonly asUpdate: {
      readonly assetId: u32;
      readonly name: Bytes;
      readonly assetType: PalletAssetRegistryAssetType;
      readonly existentialDeposit: Option<u128>;
    } & Struct;
    readonly isSetMetadata: boolean;
    readonly asSetMetadata: {
      readonly assetId: u32;
      readonly symbol: Bytes;
      readonly decimals: u8;
    } & Struct;
    readonly isSetLocation: boolean;
    readonly asSetLocation: {
      readonly assetId: u32;
      readonly location: Null;
    } & Struct;
    readonly isAddAssetToPool: boolean;
    readonly asAddAssetToPool: {
      readonly pool: Bytes;
      readonly assetId: u32;
    } & Struct;
    readonly isDeleteAssetFromPool: boolean;
    readonly asDeleteAssetFromPool: {
      readonly pool: Bytes;
      readonly assetId: u32;
    } & Struct;
    readonly type: 'Register' | 'Update' | 'SetMetadata' | 'SetLocation' | 'AddAssetToPool' | 'DeleteAssetFromPool';
  }

  /** @name OrmlCurrenciesModuleCall (239) */
  export interface OrmlCurrenciesModuleCall extends Enum {
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly dest: MultiAddress;
      readonly currencyId: u32;
      readonly amount: Compact<u128>;
    } & Struct;
    readonly isTransferNativeCurrency: boolean;
    readonly asTransferNativeCurrency: {
      readonly dest: MultiAddress;
      readonly amount: Compact<u128>;
    } & Struct;
    readonly isUpdateBalance: boolean;
    readonly asUpdateBalance: {
      readonly who: MultiAddress;
      readonly currencyId: u32;
      readonly amount: i128;
    } & Struct;
    readonly type: 'Transfer' | 'TransferNativeCurrency' | 'UpdateBalance';
  }

  /** @name OrmlTokensModuleCall (240) */
  export interface OrmlTokensModuleCall extends Enum {
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly dest: MultiAddress;
      readonly currencyId: u32;
      readonly amount: Compact<u128>;
    } & Struct;
    readonly isTransferAll: boolean;
    readonly asTransferAll: {
      readonly dest: MultiAddress;
      readonly currencyId: u32;
      readonly keepAlive: bool;
    } & Struct;
    readonly isTransferKeepAlive: boolean;
    readonly asTransferKeepAlive: {
      readonly dest: MultiAddress;
      readonly currencyId: u32;
      readonly amount: Compact<u128>;
    } & Struct;
    readonly isForceTransfer: boolean;
    readonly asForceTransfer: {
      readonly source: MultiAddress;
      readonly dest: MultiAddress;
      readonly currencyId: u32;
      readonly amount: Compact<u128>;
    } & Struct;
    readonly isSetBalance: boolean;
    readonly asSetBalance: {
      readonly who: MultiAddress;
      readonly currencyId: u32;
      readonly newFree: Compact<u128>;
      readonly newReserved: Compact<u128>;
    } & Struct;
    readonly type: 'Transfer' | 'TransferAll' | 'TransferKeepAlive' | 'ForceTransfer' | 'SetBalance';
  }

  /** @name PalletTokenWrapperCall (241) */
  export interface PalletTokenWrapperCall extends Enum {
    readonly isSetWrappingFee: boolean;
    readonly asSetWrappingFee: {
      readonly fee: u128;
      readonly intoPoolShareId: u32;
    } & Struct;
    readonly isWrap: boolean;
    readonly asWrap: {
      readonly fromAssetId: u32;
      readonly intoPoolShareId: u32;
      readonly amount: u128;
      readonly recipient: AccountId32;
    } & Struct;
    readonly isUnwrap: boolean;
    readonly asUnwrap: {
      readonly fromPoolShareId: u32;
      readonly intoAssetId: u32;
      readonly amount: u128;
      readonly recipient: AccountId32;
    } & Struct;
    readonly type: 'SetWrappingFee' | 'Wrap' | 'Unwrap';
  }

  /** @name PalletVerifierCall (242) */
  export interface PalletVerifierCall extends Enum {
    readonly isForceSetParameters: boolean;
    readonly asForceSetParameters: {
      readonly parameters: Bytes;
    } & Struct;
    readonly type: 'ForceSetParameters';
  }

  /** @name PalletMtCall (244) */
  export interface PalletMtCall extends Enum {
    readonly isCreate: boolean;
    readonly asCreate: {
      readonly depth: u8;
    } & Struct;
    readonly isInsert: boolean;
    readonly asInsert: {
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly isForceSetDefaultHashes: boolean;
    readonly asForceSetDefaultHashes: {
      readonly defaultHashes: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>;
    } & Struct;
    readonly type: 'Create' | 'Insert' | 'ForceSetDefaultHashes';
  }

  /** @name PalletLinkableTreeCall (246) */
  export interface PalletLinkableTreeCall extends Enum {
    readonly isCreate: boolean;
    readonly asCreate: {
      readonly maxEdges: u32;
      readonly depth: u8;
    } & Struct;
    readonly type: 'Create';
  }

  /** @name PalletMixerCall (247) */
  export interface PalletMixerCall extends Enum {
    readonly isCreate: boolean;
    readonly asCreate: {
      readonly depositSize: u128;
      readonly depth: u8;
      readonly asset: u32;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly id: u32;
      readonly proofBytes: Bytes;
      readonly root: EggStandaloneRuntimeProtocolSubstrateConfigElement;
      readonly nullifierHash: EggStandaloneRuntimeProtocolSubstrateConfigElement;
      readonly recipient: AccountId32;
      readonly relayer: AccountId32;
      readonly fee: u128;
      readonly refund: u128;
    } & Struct;
    readonly type: 'Create' | 'Deposit' | 'Withdraw';
  }

  /** @name PalletAnchorCall (248) */
  export interface PalletAnchorCall extends Enum {
    readonly isCreate: boolean;
    readonly asCreate: {
      readonly depositSize: u128;
      readonly maxEdges: u32;
      readonly depth: u8;
      readonly asset: u32;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly isDepositAndUpdateLinkedAnchors: boolean;
    readonly asDepositAndUpdateLinkedAnchors: {
      readonly treeId: u32;
      readonly leaf: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly id: u32;
      readonly proofBytes: Bytes;
      readonly roots: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>;
      readonly nullifierHash: EggStandaloneRuntimeProtocolSubstrateConfigElement;
      readonly recipient: AccountId32;
      readonly relayer: AccountId32;
      readonly fee: u128;
      readonly refund: u128;
      readonly commitment: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    } & Struct;
    readonly type: 'Create' | 'Deposit' | 'DepositAndUpdateLinkedAnchors' | 'Withdraw';
  }

  /** @name PalletAnchorHandlerCall (249) */
  export interface PalletAnchorHandlerCall extends Enum {
    readonly isExecuteAnchorCreateProposal: boolean;
    readonly asExecuteAnchorCreateProposal: {
      readonly depositSize: u128;
      readonly srcChainId: u64;
      readonly rId: U8aFixed;
      readonly maxEdges: u32;
      readonly treeDepth: u8;
      readonly asset: u32;
    } & Struct;
    readonly isExecuteAnchorUpdateProposal: boolean;
    readonly asExecuteAnchorUpdateProposal: {
      readonly rId: U8aFixed;
      readonly anchorMetadata: PalletLinkableTreeEdgeMetadata;
    } & Struct;
    readonly type: 'ExecuteAnchorCreateProposal' | 'ExecuteAnchorUpdateProposal';
  }

  /** @name PalletLinkableTreeEdgeMetadata (250) */
  export interface PalletLinkableTreeEdgeMetadata extends Struct {
    readonly srcChainId: u64;
    readonly root: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    readonly latestLeafIndex: u32;
  }

  /** @name PalletSignatureBridgeCall (251) */
  export interface PalletSignatureBridgeCall extends Enum {
    readonly isSetMaintainer: boolean;
    readonly asSetMaintainer: {
      readonly message: Bytes;
      readonly signature: Bytes;
    } & Struct;
    readonly isForceSetMaintainer: boolean;
    readonly asForceSetMaintainer: {
      readonly newMaintainer: Bytes;
    } & Struct;
    readonly isSetResource: boolean;
    readonly asSetResource: {
      readonly id: U8aFixed;
      readonly method: Bytes;
    } & Struct;
    readonly isRemoveResource: boolean;
    readonly asRemoveResource: {
      readonly id: U8aFixed;
    } & Struct;
    readonly isWhitelistChain: boolean;
    readonly asWhitelistChain: {
      readonly id: u64;
    } & Struct;
    readonly isExecuteProposal: boolean;
    readonly asExecuteProposal: {
      readonly srcId: u64;
      readonly call: Call;
      readonly proposalData: Bytes;
      readonly signature: Bytes;
    } & Struct;
    readonly type: 'SetMaintainer' | 'ForceSetMaintainer' | 'SetResource' | 'RemoveResource' | 'WhitelistChain' | 'ExecuteProposal';
  }

  /** @name PalletSudoError (252) */
  export interface PalletSudoError extends Enum {
    readonly isRequireSudo: boolean;
    readonly type: 'RequireSudo';
  }

  /** @name PalletBalancesBalanceLock (255) */
  export interface PalletBalancesBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
    readonly reasons: PalletBalancesReasons;
  }

  /** @name PalletBalancesReasons (256) */
  export interface PalletBalancesReasons extends Enum {
    readonly isFee: boolean;
    readonly isMisc: boolean;
    readonly isAll: boolean;
    readonly type: 'Fee' | 'Misc' | 'All';
  }

  /** @name PalletBalancesReserveData (259) */
  export interface PalletBalancesReserveData extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
  }

  /** @name PalletBalancesReleases (261) */
  export interface PalletBalancesReleases extends Enum {
    readonly isV100: boolean;
    readonly isV200: boolean;
    readonly type: 'V100' | 'V200';
  }

  /** @name PalletBalancesError (262) */
  export interface PalletBalancesError extends Enum {
    readonly isVestingBalance: boolean;
    readonly isLiquidityRestrictions: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isExistentialDeposit: boolean;
    readonly isKeepAlive: boolean;
    readonly isExistingVestingSchedule: boolean;
    readonly isDeadAccount: boolean;
    readonly isTooManyReserves: boolean;
    readonly type: 'VestingBalance' | 'LiquidityRestrictions' | 'InsufficientBalance' | 'ExistentialDeposit' | 'KeepAlive' | 'ExistingVestingSchedule' | 'DeadAccount' | 'TooManyReserves';
  }

  /** @name PalletTransactionPaymentReleases (264) */
  export interface PalletTransactionPaymentReleases extends Enum {
    readonly isV1Ancient: boolean;
    readonly isV2: boolean;
    readonly type: 'V1Ancient' | 'V2';
  }

  /** @name FrameSupportWeightsWeightToFeeCoefficient (266) */
  export interface FrameSupportWeightsWeightToFeeCoefficient extends Struct {
    readonly coeffInteger: u128;
    readonly coeffFrac: Perbill;
    readonly negative: bool;
    readonly degree: u8;
  }

  /** @name PalletAuthorshipUncleEntryItem (268) */
  export interface PalletAuthorshipUncleEntryItem extends Enum {
    readonly isInclusionHeight: boolean;
    readonly asInclusionHeight: u32;
    readonly isUncle: boolean;
    readonly asUncle: ITuple<[H256, Option<AccountId32>]>;
    readonly type: 'InclusionHeight' | 'Uncle';
  }

  /** @name PalletAuthorshipError (269) */
  export interface PalletAuthorshipError extends Enum {
    readonly isInvalidUncleParent: boolean;
    readonly isUnclesAlreadySet: boolean;
    readonly isTooManyUncles: boolean;
    readonly isGenesisUncle: boolean;
    readonly isTooHighUncle: boolean;
    readonly isUncleAlreadyIncluded: boolean;
    readonly isOldUncle: boolean;
    readonly type: 'InvalidUncleParent' | 'UnclesAlreadySet' | 'TooManyUncles' | 'GenesisUncle' | 'TooHighUncle' | 'UncleAlreadyIncluded' | 'OldUncle';
  }

  /** @name PalletGrandpaStoredState (273) */
  export interface PalletGrandpaStoredState extends Enum {
    readonly isLive: boolean;
    readonly isPendingPause: boolean;
    readonly asPendingPause: {
      readonly scheduledAt: u32;
      readonly delay: u32;
    } & Struct;
    readonly isPaused: boolean;
    readonly isPendingResume: boolean;
    readonly asPendingResume: {
      readonly scheduledAt: u32;
      readonly delay: u32;
    } & Struct;
    readonly type: 'Live' | 'PendingPause' | 'Paused' | 'PendingResume';
  }

  /** @name PalletGrandpaStoredPendingChange (274) */
  export interface PalletGrandpaStoredPendingChange extends Struct {
    readonly scheduledAt: u32;
    readonly delay: u32;
    readonly nextAuthorities: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>;
    readonly forced: Option<u32>;
  }

  /** @name PalletGrandpaError (276) */
  export interface PalletGrandpaError extends Enum {
    readonly isPauseFailed: boolean;
    readonly isResumeFailed: boolean;
    readonly isChangePending: boolean;
    readonly isTooSoon: boolean;
    readonly isInvalidKeyOwnershipProof: boolean;
    readonly isInvalidEquivocationProof: boolean;
    readonly isDuplicateOffenceReport: boolean;
    readonly type: 'PauseFailed' | 'ResumeFailed' | 'ChangePending' | 'TooSoon' | 'InvalidKeyOwnershipProof' | 'InvalidEquivocationProof' | 'DuplicateOffenceReport';
  }

  /** @name PalletDemocracyPreimageStatus (280) */
  export interface PalletDemocracyPreimageStatus extends Enum {
    readonly isMissing: boolean;
    readonly asMissing: u32;
    readonly isAvailable: boolean;
    readonly asAvailable: {
      readonly data: Bytes;
      readonly provider: AccountId32;
      readonly deposit: u128;
      readonly since: u32;
      readonly expiry: Option<u32>;
    } & Struct;
    readonly type: 'Missing' | 'Available';
  }

  /** @name PalletDemocracyReferendumInfo (281) */
  export interface PalletDemocracyReferendumInfo extends Enum {
    readonly isOngoing: boolean;
    readonly asOngoing: PalletDemocracyReferendumStatus;
    readonly isFinished: boolean;
    readonly asFinished: {
      readonly approved: bool;
      readonly end: u32;
    } & Struct;
    readonly type: 'Ongoing' | 'Finished';
  }

  /** @name PalletDemocracyReferendumStatus (282) */
  export interface PalletDemocracyReferendumStatus extends Struct {
    readonly end: u32;
    readonly proposalHash: H256;
    readonly threshold: PalletDemocracyVoteThreshold;
    readonly delay: u32;
    readonly tally: PalletDemocracyTally;
  }

  /** @name PalletDemocracyTally (283) */
  export interface PalletDemocracyTally extends Struct {
    readonly ayes: u128;
    readonly nays: u128;
    readonly turnout: u128;
  }

  /** @name PalletDemocracyVoteVoting (284) */
  export interface PalletDemocracyVoteVoting extends Enum {
    readonly isDirect: boolean;
    readonly asDirect: {
      readonly votes: Vec<ITuple<[u32, PalletDemocracyVoteAccountVote]>>;
      readonly delegations: PalletDemocracyDelegations;
      readonly prior: PalletDemocracyVotePriorLock;
    } & Struct;
    readonly isDelegating: boolean;
    readonly asDelegating: {
      readonly balance: u128;
      readonly target: AccountId32;
      readonly conviction: PalletDemocracyConviction;
      readonly delegations: PalletDemocracyDelegations;
      readonly prior: PalletDemocracyVotePriorLock;
    } & Struct;
    readonly type: 'Direct' | 'Delegating';
  }

  /** @name PalletDemocracyDelegations (287) */
  export interface PalletDemocracyDelegations extends Struct {
    readonly votes: u128;
    readonly capital: u128;
  }

  /** @name PalletDemocracyVotePriorLock (288) */
  export interface PalletDemocracyVotePriorLock extends ITuple<[u32, u128]> {}

  /** @name PalletDemocracyReleases (291) */
  export interface PalletDemocracyReleases extends Enum {
    readonly isV1: boolean;
    readonly type: 'V1';
  }

  /** @name PalletDemocracyError (292) */
  export interface PalletDemocracyError extends Enum {
    readonly isValueLow: boolean;
    readonly isProposalMissing: boolean;
    readonly isAlreadyCanceled: boolean;
    readonly isDuplicateProposal: boolean;
    readonly isProposalBlacklisted: boolean;
    readonly isNotSimpleMajority: boolean;
    readonly isInvalidHash: boolean;
    readonly isNoProposal: boolean;
    readonly isAlreadyVetoed: boolean;
    readonly isDuplicatePreimage: boolean;
    readonly isNotImminent: boolean;
    readonly isTooEarly: boolean;
    readonly isImminent: boolean;
    readonly isPreimageMissing: boolean;
    readonly isReferendumInvalid: boolean;
    readonly isPreimageInvalid: boolean;
    readonly isNoneWaiting: boolean;
    readonly isNotVoter: boolean;
    readonly isNoPermission: boolean;
    readonly isAlreadyDelegating: boolean;
    readonly isInsufficientFunds: boolean;
    readonly isNotDelegating: boolean;
    readonly isVotesExist: boolean;
    readonly isInstantNotAllowed: boolean;
    readonly isNonsense: boolean;
    readonly isWrongUpperBound: boolean;
    readonly isMaxVotesReached: boolean;
    readonly isTooManyProposals: boolean;
    readonly type: 'ValueLow' | 'ProposalMissing' | 'AlreadyCanceled' | 'DuplicateProposal' | 'ProposalBlacklisted' | 'NotSimpleMajority' | 'InvalidHash' | 'NoProposal' | 'AlreadyVetoed' | 'DuplicatePreimage' | 'NotImminent' | 'TooEarly' | 'Imminent' | 'PreimageMissing' | 'ReferendumInvalid' | 'PreimageInvalid' | 'NoneWaiting' | 'NotVoter' | 'NoPermission' | 'AlreadyDelegating' | 'InsufficientFunds' | 'NotDelegating' | 'VotesExist' | 'InstantNotAllowed' | 'Nonsense' | 'WrongUpperBound' | 'MaxVotesReached' | 'TooManyProposals';
  }

  /** @name PalletCollectiveVotes (294) */
  export interface PalletCollectiveVotes extends Struct {
    readonly index: u32;
    readonly threshold: u32;
    readonly ayes: Vec<AccountId32>;
    readonly nays: Vec<AccountId32>;
    readonly end: u32;
  }

  /** @name PalletCollectiveError (295) */
  export interface PalletCollectiveError extends Enum {
    readonly isNotMember: boolean;
    readonly isDuplicateProposal: boolean;
    readonly isProposalMissing: boolean;
    readonly isWrongIndex: boolean;
    readonly isDuplicateVote: boolean;
    readonly isAlreadyInitialized: boolean;
    readonly isTooEarly: boolean;
    readonly isTooManyProposals: boolean;
    readonly isWrongProposalWeight: boolean;
    readonly isWrongProposalLength: boolean;
    readonly type: 'NotMember' | 'DuplicateProposal' | 'ProposalMissing' | 'WrongIndex' | 'DuplicateVote' | 'AlreadyInitialized' | 'TooEarly' | 'TooManyProposals' | 'WrongProposalWeight' | 'WrongProposalLength';
  }

  /** @name PalletElectionsPhragmenSeatHolder (297) */
  export interface PalletElectionsPhragmenSeatHolder extends Struct {
    readonly who: AccountId32;
    readonly stake: u128;
    readonly deposit: u128;
  }

  /** @name PalletElectionsPhragmenVoter (298) */
  export interface PalletElectionsPhragmenVoter extends Struct {
    readonly votes: Vec<AccountId32>;
    readonly stake: u128;
    readonly deposit: u128;
  }

  /** @name PalletElectionsPhragmenError (299) */
  export interface PalletElectionsPhragmenError extends Enum {
    readonly isUnableToVote: boolean;
    readonly isNoVotes: boolean;
    readonly isTooManyVotes: boolean;
    readonly isMaximumVotesExceeded: boolean;
    readonly isLowBalance: boolean;
    readonly isUnableToPayBond: boolean;
    readonly isMustBeVoter: boolean;
    readonly isReportSelf: boolean;
    readonly isDuplicatedCandidate: boolean;
    readonly isMemberSubmit: boolean;
    readonly isRunnerUpSubmit: boolean;
    readonly isInsufficientCandidateFunds: boolean;
    readonly isNotMember: boolean;
    readonly isInvalidWitnessData: boolean;
    readonly isInvalidVoteCount: boolean;
    readonly isInvalidRenouncing: boolean;
    readonly isInvalidReplacement: boolean;
    readonly type: 'UnableToVote' | 'NoVotes' | 'TooManyVotes' | 'MaximumVotesExceeded' | 'LowBalance' | 'UnableToPayBond' | 'MustBeVoter' | 'ReportSelf' | 'DuplicatedCandidate' | 'MemberSubmit' | 'RunnerUpSubmit' | 'InsufficientCandidateFunds' | 'NotMember' | 'InvalidWitnessData' | 'InvalidVoteCount' | 'InvalidRenouncing' | 'InvalidReplacement';
  }

  /** @name PalletElectionProviderMultiPhasePhase (300) */
  export interface PalletElectionProviderMultiPhasePhase extends Enum {
    readonly isOff: boolean;
    readonly isSigned: boolean;
    readonly isUnsigned: boolean;
    readonly asUnsigned: ITuple<[bool, u32]>;
    readonly isEmergency: boolean;
    readonly type: 'Off' | 'Signed' | 'Unsigned' | 'Emergency';
  }

  /** @name PalletElectionProviderMultiPhaseReadySolution (302) */
  export interface PalletElectionProviderMultiPhaseReadySolution extends Struct {
    readonly supports: Vec<ITuple<[AccountId32, SpNposElectionsSupport]>>;
    readonly score: Vec<u128>;
    readonly compute: PalletElectionProviderMultiPhaseElectionCompute;
  }

  /** @name PalletElectionProviderMultiPhaseRoundSnapshot (303) */
  export interface PalletElectionProviderMultiPhaseRoundSnapshot extends Struct {
    readonly voters: Vec<ITuple<[AccountId32, u64, Vec<AccountId32>]>>;
    readonly targets: Vec<AccountId32>;
  }

  /** @name PalletElectionProviderMultiPhaseSignedSignedSubmission (311) */
  export interface PalletElectionProviderMultiPhaseSignedSignedSubmission extends Struct {
    readonly who: AccountId32;
    readonly deposit: u128;
    readonly rawSolution: PalletElectionProviderMultiPhaseRawSolution;
    readonly reward: u128;
  }

  /** @name PalletElectionProviderMultiPhaseError (312) */
  export interface PalletElectionProviderMultiPhaseError extends Enum {
    readonly isPreDispatchEarlySubmission: boolean;
    readonly isPreDispatchWrongWinnerCount: boolean;
    readonly isPreDispatchWeakSubmission: boolean;
    readonly isSignedQueueFull: boolean;
    readonly isSignedCannotPayDeposit: boolean;
    readonly isSignedInvalidWitness: boolean;
    readonly isSignedTooMuchWeight: boolean;
    readonly isOcwCallWrongEra: boolean;
    readonly isMissingSnapshotMetadata: boolean;
    readonly isInvalidSubmissionIndex: boolean;
    readonly isCallNotAllowed: boolean;
    readonly isFallbackFailed: boolean;
    readonly type: 'PreDispatchEarlySubmission' | 'PreDispatchWrongWinnerCount' | 'PreDispatchWeakSubmission' | 'SignedQueueFull' | 'SignedCannotPayDeposit' | 'SignedInvalidWitness' | 'SignedTooMuchWeight' | 'OcwCallWrongEra' | 'MissingSnapshotMetadata' | 'InvalidSubmissionIndex' | 'CallNotAllowed' | 'FallbackFailed';
  }

  /** @name PalletStakingStakingLedger (313) */
  export interface PalletStakingStakingLedger extends Struct {
    readonly stash: AccountId32;
    readonly total: Compact<u128>;
    readonly active: Compact<u128>;
    readonly unlocking: Vec<PalletStakingUnlockChunk>;
    readonly claimedRewards: Vec<u32>;
  }

  /** @name PalletStakingUnlockChunk (315) */
  export interface PalletStakingUnlockChunk extends Struct {
    readonly value: Compact<u128>;
    readonly era: Compact<u32>;
  }

  /** @name PalletStakingNominations (316) */
  export interface PalletStakingNominations extends Struct {
    readonly targets: Vec<AccountId32>;
    readonly submittedIn: u32;
    readonly suppressed: bool;
  }

  /** @name PalletStakingActiveEraInfo (317) */
  export interface PalletStakingActiveEraInfo extends Struct {
    readonly index: u32;
    readonly start: Option<u64>;
  }

  /** @name PalletStakingExposure (319) */
  export interface PalletStakingExposure extends Struct {
    readonly total: Compact<u128>;
    readonly own: Compact<u128>;
    readonly others: Vec<PalletStakingIndividualExposure>;
  }

  /** @name PalletStakingIndividualExposure (321) */
  export interface PalletStakingIndividualExposure extends Struct {
    readonly who: AccountId32;
    readonly value: Compact<u128>;
  }

  /** @name PalletStakingEraRewardPoints (322) */
  export interface PalletStakingEraRewardPoints extends Struct {
    readonly total: u32;
    readonly individual: BTreeMap<AccountId32, u32>;
  }

  /** @name PalletStakingForcing (326) */
  export interface PalletStakingForcing extends Enum {
    readonly isNotForcing: boolean;
    readonly isForceNew: boolean;
    readonly isForceNone: boolean;
    readonly isForceAlways: boolean;
    readonly type: 'NotForcing' | 'ForceNew' | 'ForceNone' | 'ForceAlways';
  }

  /** @name PalletStakingUnappliedSlash (328) */
  export interface PalletStakingUnappliedSlash extends Struct {
    readonly validator: AccountId32;
    readonly own: u128;
    readonly others: Vec<ITuple<[AccountId32, u128]>>;
    readonly reporters: Vec<AccountId32>;
    readonly payout: u128;
  }

  /** @name PalletStakingSlashingSlashingSpans (330) */
  export interface PalletStakingSlashingSlashingSpans extends Struct {
    readonly spanIndex: u32;
    readonly lastStart: u32;
    readonly lastNonzeroSlash: u32;
    readonly prior: Vec<u32>;
  }

  /** @name PalletStakingSlashingSpanRecord (331) */
  export interface PalletStakingSlashingSpanRecord extends Struct {
    readonly slashed: u128;
    readonly paidOut: u128;
  }

  /** @name PalletStakingReleases (334) */
  export interface PalletStakingReleases extends Enum {
    readonly isV100Ancient: boolean;
    readonly isV200: boolean;
    readonly isV300: boolean;
    readonly isV400: boolean;
    readonly isV500: boolean;
    readonly isV600: boolean;
    readonly isV700: boolean;
    readonly isV800: boolean;
    readonly type: 'V100Ancient' | 'V200' | 'V300' | 'V400' | 'V500' | 'V600' | 'V700' | 'V800';
  }

  /** @name PalletStakingPalletError (335) */
  export interface PalletStakingPalletError extends Enum {
    readonly isNotController: boolean;
    readonly isNotStash: boolean;
    readonly isAlreadyBonded: boolean;
    readonly isAlreadyPaired: boolean;
    readonly isEmptyTargets: boolean;
    readonly isDuplicateIndex: boolean;
    readonly isInvalidSlashIndex: boolean;
    readonly isInsufficientBond: boolean;
    readonly isNoMoreChunks: boolean;
    readonly isNoUnlockChunk: boolean;
    readonly isFundedTarget: boolean;
    readonly isInvalidEraToReward: boolean;
    readonly isInvalidNumberOfNominations: boolean;
    readonly isNotSortedAndUnique: boolean;
    readonly isAlreadyClaimed: boolean;
    readonly isIncorrectHistoryDepth: boolean;
    readonly isIncorrectSlashingSpans: boolean;
    readonly isBadState: boolean;
    readonly isTooManyTargets: boolean;
    readonly isBadTarget: boolean;
    readonly isCannotChillOther: boolean;
    readonly isTooManyNominators: boolean;
    readonly isTooManyValidators: boolean;
    readonly isCommissionTooLow: boolean;
    readonly type: 'NotController' | 'NotStash' | 'AlreadyBonded' | 'AlreadyPaired' | 'EmptyTargets' | 'DuplicateIndex' | 'InvalidSlashIndex' | 'InsufficientBond' | 'NoMoreChunks' | 'NoUnlockChunk' | 'FundedTarget' | 'InvalidEraToReward' | 'InvalidNumberOfNominations' | 'NotSortedAndUnique' | 'AlreadyClaimed' | 'IncorrectHistoryDepth' | 'IncorrectSlashingSpans' | 'BadState' | 'TooManyTargets' | 'BadTarget' | 'CannotChillOther' | 'TooManyNominators' | 'TooManyValidators' | 'CommissionTooLow';
  }

  /** @name SpCoreCryptoKeyTypeId (339) */
  export interface SpCoreCryptoKeyTypeId extends U8aFixed {}

  /** @name PalletSessionError (340) */
  export interface PalletSessionError extends Enum {
    readonly isInvalidProof: boolean;
    readonly isNoAssociatedValidatorId: boolean;
    readonly isDuplicatedKey: boolean;
    readonly isNoKeys: boolean;
    readonly isNoAccount: boolean;
    readonly type: 'InvalidProof' | 'NoAssociatedValidatorId' | 'DuplicatedKey' | 'NoKeys' | 'NoAccount';
  }

  /** @name PalletTreasuryProposal (341) */
  export interface PalletTreasuryProposal extends Struct {
    readonly proposer: AccountId32;
    readonly value: u128;
    readonly beneficiary: AccountId32;
    readonly bond: u128;
  }

  /** @name FrameSupportPalletId (344) */
  export interface FrameSupportPalletId extends U8aFixed {}

  /** @name PalletTreasuryError (345) */
  export interface PalletTreasuryError extends Enum {
    readonly isInsufficientProposersBalance: boolean;
    readonly isInvalidIndex: boolean;
    readonly isTooManyApprovals: boolean;
    readonly type: 'InsufficientProposersBalance' | 'InvalidIndex' | 'TooManyApprovals';
  }

  /** @name PalletBountiesBounty (346) */
  export interface PalletBountiesBounty extends Struct {
    readonly proposer: AccountId32;
    readonly value: u128;
    readonly fee: u128;
    readonly curatorDeposit: u128;
    readonly bond: u128;
    readonly status: PalletBountiesBountyStatus;
  }

  /** @name PalletBountiesBountyStatus (347) */
  export interface PalletBountiesBountyStatus extends Enum {
    readonly isProposed: boolean;
    readonly isApproved: boolean;
    readonly isFunded: boolean;
    readonly isCuratorProposed: boolean;
    readonly asCuratorProposed: {
      readonly curator: AccountId32;
    } & Struct;
    readonly isActive: boolean;
    readonly asActive: {
      readonly curator: AccountId32;
      readonly updateDue: u32;
    } & Struct;
    readonly isPendingPayout: boolean;
    readonly asPendingPayout: {
      readonly curator: AccountId32;
      readonly beneficiary: AccountId32;
      readonly unlockAt: u32;
    } & Struct;
    readonly type: 'Proposed' | 'Approved' | 'Funded' | 'CuratorProposed' | 'Active' | 'PendingPayout';
  }

  /** @name PalletBountiesError (349) */
  export interface PalletBountiesError extends Enum {
    readonly isInsufficientProposersBalance: boolean;
    readonly isInvalidIndex: boolean;
    readonly isReasonTooBig: boolean;
    readonly isUnexpectedStatus: boolean;
    readonly isRequireCurator: boolean;
    readonly isInvalidValue: boolean;
    readonly isInvalidFee: boolean;
    readonly isPendingPayout: boolean;
    readonly isPremature: boolean;
    readonly isHasActiveChildBounty: boolean;
    readonly isTooManyQueued: boolean;
    readonly type: 'InsufficientProposersBalance' | 'InvalidIndex' | 'ReasonTooBig' | 'UnexpectedStatus' | 'RequireCurator' | 'InvalidValue' | 'InvalidFee' | 'PendingPayout' | 'Premature' | 'HasActiveChildBounty' | 'TooManyQueued';
  }

  /** @name PalletChildBountiesChildBounty (350) */
  export interface PalletChildBountiesChildBounty extends Struct {
    readonly parentBounty: u32;
    readonly value: u128;
    readonly fee: u128;
    readonly curatorDeposit: u128;
    readonly status: PalletChildBountiesChildBountyStatus;
  }

  /** @name PalletChildBountiesChildBountyStatus (351) */
  export interface PalletChildBountiesChildBountyStatus extends Enum {
    readonly isAdded: boolean;
    readonly isCuratorProposed: boolean;
    readonly asCuratorProposed: {
      readonly curator: AccountId32;
    } & Struct;
    readonly isActive: boolean;
    readonly asActive: {
      readonly curator: AccountId32;
    } & Struct;
    readonly isPendingPayout: boolean;
    readonly asPendingPayout: {
      readonly curator: AccountId32;
      readonly beneficiary: AccountId32;
      readonly unlockAt: u32;
    } & Struct;
    readonly type: 'Added' | 'CuratorProposed' | 'Active' | 'PendingPayout';
  }

  /** @name PalletChildBountiesError (352) */
  export interface PalletChildBountiesError extends Enum {
    readonly isParentBountyNotActive: boolean;
    readonly isInsufficientBountyBalance: boolean;
    readonly isTooManyChildBounties: boolean;
    readonly type: 'ParentBountyNotActive' | 'InsufficientBountyBalance' | 'TooManyChildBounties';
  }

  /** @name PalletBagsListListNode (353) */
  export interface PalletBagsListListNode extends Struct {
    readonly id: AccountId32;
    readonly prev: Option<AccountId32>;
    readonly next: Option<AccountId32>;
    readonly bagUpper: u64;
  }

  /** @name PalletBagsListListBag (354) */
  export interface PalletBagsListListBag extends Struct {
    readonly head: Option<AccountId32>;
    readonly tail: Option<AccountId32>;
  }

  /** @name PalletBagsListError (356) */
  export interface PalletBagsListError extends Enum {
    readonly isNotInSameBag: boolean;
    readonly isIdNotFound: boolean;
    readonly isNotHeavier: boolean;
    readonly type: 'NotInSameBag' | 'IdNotFound' | 'NotHeavier';
  }

  /** @name PalletSchedulerScheduledV3 (359) */
  export interface PalletSchedulerScheduledV3 extends Struct {
    readonly maybeId: Option<Bytes>;
    readonly priority: u8;
    readonly call: FrameSupportScheduleMaybeHashed;
    readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
    readonly origin: EggStandaloneRuntimeOriginCaller;
  }

  /** @name EggStandaloneRuntimeOriginCaller (360) */
  export interface EggStandaloneRuntimeOriginCaller extends Enum {
    readonly isSystem: boolean;
    readonly asSystem: FrameSupportDispatchRawOrigin;
    readonly isVoid: boolean;
    readonly isCouncil: boolean;
    readonly asCouncil: PalletCollectiveRawOrigin;
    readonly type: 'System' | 'Void' | 'Council';
  }

  /** @name FrameSupportDispatchRawOrigin (361) */
  export interface FrameSupportDispatchRawOrigin extends Enum {
    readonly isRoot: boolean;
    readonly isSigned: boolean;
    readonly asSigned: AccountId32;
    readonly isNone: boolean;
    readonly type: 'Root' | 'Signed' | 'None';
  }

  /** @name PalletCollectiveRawOrigin (362) */
  export interface PalletCollectiveRawOrigin extends Enum {
    readonly isMembers: boolean;
    readonly asMembers: ITuple<[u32, u32]>;
    readonly isMember: boolean;
    readonly asMember: AccountId32;
    readonly isPhantom: boolean;
    readonly type: 'Members' | 'Member' | 'Phantom';
  }

  /** @name SpCoreVoid (363) */
  export type SpCoreVoid = Null;

  /** @name PalletSchedulerError (364) */
  export interface PalletSchedulerError extends Enum {
    readonly isFailedToSchedule: boolean;
    readonly isNotFound: boolean;
    readonly isTargetBlockNumberInPast: boolean;
    readonly isRescheduleNoChange: boolean;
    readonly type: 'FailedToSchedule' | 'NotFound' | 'TargetBlockNumberInPast' | 'RescheduleNoChange';
  }

  /** @name PalletPreimageRequestStatus (365) */
  export interface PalletPreimageRequestStatus extends Enum {
    readonly isUnrequested: boolean;
    readonly asUnrequested: Option<ITuple<[AccountId32, u128]>>;
    readonly isRequested: boolean;
    readonly asRequested: u32;
    readonly type: 'Unrequested' | 'Requested';
  }

  /** @name PalletPreimageError (368) */
  export interface PalletPreimageError extends Enum {
    readonly isTooLarge: boolean;
    readonly isAlreadyNoted: boolean;
    readonly isNotAuthorized: boolean;
    readonly isNotNoted: boolean;
    readonly isRequested: boolean;
    readonly isNotRequested: boolean;
    readonly type: 'TooLarge' | 'AlreadyNoted' | 'NotAuthorized' | 'NotNoted' | 'Requested' | 'NotRequested';
  }

  /** @name SpStakingOffenceOffenceDetails (369) */
  export interface SpStakingOffenceOffenceDetails extends Struct {
    readonly offender: ITuple<[AccountId32, PalletStakingExposure]>;
    readonly reporters: Vec<AccountId32>;
  }

  /** @name PalletDkgMetadataRoundMetadata (373) */
  export interface PalletDkgMetadataRoundMetadata extends Struct {
    readonly currRoundPubKey: Bytes;
    readonly nextRoundPubKey: Bytes;
    readonly refreshSignature: Bytes;
  }

  /** @name PalletDkgMetadataError (377) */
  export interface PalletDkgMetadataError extends Enum {
    readonly isNoMappedAccount: boolean;
    readonly isInvalidThreshold: boolean;
    readonly isMustBeAQueuedAuthority: boolean;
    readonly isMustBeAnActiveAuthority: boolean;
    readonly isInvalidRefreshDelay: boolean;
    readonly isInvalidPublicKeys: boolean;
    readonly isAlreadySubmittedPublicKey: boolean;
    readonly isAlreadySubmittedSignature: boolean;
    readonly isUsedSignature: boolean;
    readonly isInvalidSignature: boolean;
    readonly isInvalidMisbehaviourReports: boolean;
    readonly isRefreshInProgress: boolean;
    readonly isManualRefreshFailed: boolean;
    readonly isNoNextPublicKey: boolean;
    readonly isInvalidControllerAccount: boolean;
    readonly type: 'NoMappedAccount' | 'InvalidThreshold' | 'MustBeAQueuedAuthority' | 'MustBeAnActiveAuthority' | 'InvalidRefreshDelay' | 'InvalidPublicKeys' | 'AlreadySubmittedPublicKey' | 'AlreadySubmittedSignature' | 'UsedSignature' | 'InvalidSignature' | 'InvalidMisbehaviourReports' | 'RefreshInProgress' | 'ManualRefreshFailed' | 'NoNextPublicKey' | 'InvalidControllerAccount';
  }

  /** @name PalletDkgProposalsProposalVotes (380) */
  export interface PalletDkgProposalsProposalVotes extends Struct {
    readonly votesFor: Vec<AccountId32>;
    readonly votesAgainst: Vec<AccountId32>;
    readonly status: PalletDkgProposalsProposalStatus;
    readonly expiry: u32;
  }

  /** @name PalletDkgProposalsProposalStatus (381) */
  export interface PalletDkgProposalsProposalStatus extends Enum {
    readonly isInitiated: boolean;
    readonly isApproved: boolean;
    readonly isRejected: boolean;
    readonly type: 'Initiated' | 'Approved' | 'Rejected';
  }

  /** @name PalletDkgProposalsError (382) */
  export interface PalletDkgProposalsError extends Enum {
    readonly isInvalidPermissions: boolean;
    readonly isThresholdNotSet: boolean;
    readonly isInvalidChainId: boolean;
    readonly isInvalidThreshold: boolean;
    readonly isChainNotWhitelisted: boolean;
    readonly isChainAlreadyWhitelisted: boolean;
    readonly isResourceDoesNotExist: boolean;
    readonly isProposerAlreadyExists: boolean;
    readonly isProposerInvalid: boolean;
    readonly isMustBeProposer: boolean;
    readonly isProposerAlreadyVoted: boolean;
    readonly isProposalAlreadyExists: boolean;
    readonly isProposalDoesNotExist: boolean;
    readonly isProposalNotComplete: boolean;
    readonly isProposalAlreadyComplete: boolean;
    readonly isProposalExpired: boolean;
    readonly isProposerCountIsZero: boolean;
    readonly type: 'InvalidPermissions' | 'ThresholdNotSet' | 'InvalidChainId' | 'InvalidThreshold' | 'ChainNotWhitelisted' | 'ChainAlreadyWhitelisted' | 'ResourceDoesNotExist' | 'ProposerAlreadyExists' | 'ProposerInvalid' | 'MustBeProposer' | 'ProposerAlreadyVoted' | 'ProposalAlreadyExists' | 'ProposalDoesNotExist' | 'ProposalNotComplete' | 'ProposalAlreadyComplete' | 'ProposalExpired' | 'ProposerCountIsZero';
  }

  /** @name PalletDkgProposalHandlerError (384) */
  export interface PalletDkgProposalHandlerError extends Enum {
    readonly isNoneValue: boolean;
    readonly isStorageOverflow: boolean;
    readonly isProposalFormatInvalid: boolean;
    readonly isProposalSignatureInvalid: boolean;
    readonly isProposalDoesNotExists: boolean;
    readonly isProposalAlreadyExists: boolean;
    readonly isChainIdInvalid: boolean;
    readonly isProposalsLengthOverflow: boolean;
    readonly type: 'NoneValue' | 'StorageOverflow' | 'ProposalFormatInvalid' | 'ProposalSignatureInvalid' | 'ProposalDoesNotExists' | 'ProposalAlreadyExists' | 'ChainIdInvalid' | 'ProposalsLengthOverflow';
  }

  /** @name PalletHasherError (385) */
  export interface PalletHasherError extends Enum {
    readonly isParametersNotInitialized: boolean;
    readonly isHashError: boolean;
    readonly type: 'ParametersNotInitialized' | 'HashError';
  }

  /** @name PalletAssetRegistryAssetDetails (386) */
  export interface PalletAssetRegistryAssetDetails extends Struct {
    readonly name: Bytes;
    readonly assetType: PalletAssetRegistryAssetType;
    readonly existentialDeposit: u128;
    readonly locked: bool;
  }

  /** @name PalletAssetRegistryAssetMetadata (387) */
  export interface PalletAssetRegistryAssetMetadata extends Struct {
    readonly symbol: Bytes;
    readonly decimals: u8;
  }

  /** @name PalletAssetRegistryError (388) */
  export interface PalletAssetRegistryError extends Enum {
    readonly isNoIdAvailable: boolean;
    readonly isAssetNotFound: boolean;
    readonly isTooLong: boolean;
    readonly isAssetNotRegistered: boolean;
    readonly isAssetAlreadyRegistered: boolean;
    readonly isInvalidSharedAssetLen: boolean;
    readonly isAssetExistsInPool: boolean;
    readonly isAssetNotFoundInPool: boolean;
    readonly type: 'NoIdAvailable' | 'AssetNotFound' | 'TooLong' | 'AssetNotRegistered' | 'AssetAlreadyRegistered' | 'InvalidSharedAssetLen' | 'AssetExistsInPool' | 'AssetNotFoundInPool';
  }

  /** @name OrmlCurrenciesModuleError (389) */
  export interface OrmlCurrenciesModuleError extends Enum {
    readonly isAmountIntoBalanceFailed: boolean;
    readonly isBalanceTooLow: boolean;
    readonly isDepositFailed: boolean;
    readonly type: 'AmountIntoBalanceFailed' | 'BalanceTooLow' | 'DepositFailed';
  }

  /** @name OrmlTokensBalanceLock (391) */
  export interface OrmlTokensBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
  }

  /** @name OrmlTokensAccountData (393) */
  export interface OrmlTokensAccountData extends Struct {
    readonly free: u128;
    readonly reserved: u128;
    readonly frozen: u128;
  }

  /** @name OrmlTokensModuleError (394) */
  export interface OrmlTokensModuleError extends Enum {
    readonly isBalanceTooLow: boolean;
    readonly isAmountIntoBalanceFailed: boolean;
    readonly isLiquidityRestrictions: boolean;
    readonly isMaxLocksExceeded: boolean;
    readonly isKeepAlive: boolean;
    readonly isExistentialDeposit: boolean;
    readonly isDeadAccount: boolean;
    readonly type: 'BalanceTooLow' | 'AmountIntoBalanceFailed' | 'LiquidityRestrictions' | 'MaxLocksExceeded' | 'KeepAlive' | 'ExistentialDeposit' | 'DeadAccount';
  }

  /** @name PalletTokenWrapperError (395) */
  export interface PalletTokenWrapperError extends Enum {
    readonly isInvalidAmount: boolean;
    readonly isUnregisteredAssetId: boolean;
    readonly isNotFoundInPool: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isNoWrappingFeePercentFound: boolean;
    readonly type: 'InvalidAmount' | 'UnregisteredAssetId' | 'NotFoundInPool' | 'InsufficientBalance' | 'NoWrappingFeePercentFound';
  }

  /** @name PalletVerifierError (396) */
  export interface PalletVerifierError extends Enum {
    readonly isParametersNotInitialized: boolean;
    readonly isVerifyError: boolean;
    readonly type: 'ParametersNotInitialized' | 'VerifyError';
  }

  /** @name WebbPrimitivesDepositDetails (398) */
  export interface WebbPrimitivesDepositDetails extends Struct {
    readonly depositor: AccountId32;
    readonly deposit: u128;
  }

  /** @name PalletMtTreeMetadata (399) */
  export interface PalletMtTreeMetadata extends Struct {
    readonly creator: Option<AccountId32>;
    readonly paused: bool;
    readonly leafCount: u32;
    readonly maxLeaves: u32;
    readonly depth: u8;
    readonly root: EggStandaloneRuntimeProtocolSubstrateConfigElement;
    readonly edgeNodes: Vec<EggStandaloneRuntimeProtocolSubstrateConfigElement>;
  }

  /** @name PalletMtError (400) */
  export interface PalletMtError extends Enum {
    readonly isInvalidPermissions: boolean;
    readonly isInvalidTreeDepth: boolean;
    readonly isInvalidLeafIndex: boolean;
    readonly isExceedsMaxLeaves: boolean;
    readonly isTreeDoesntExist: boolean;
    readonly isExceedsMaxDefaultHashes: boolean;
    readonly type: 'InvalidPermissions' | 'InvalidTreeDepth' | 'InvalidLeafIndex' | 'ExceedsMaxLeaves' | 'TreeDoesntExist' | 'ExceedsMaxDefaultHashes';
  }

  /** @name PalletLinkableTreeError (404) */
  export interface PalletLinkableTreeError extends Enum {
    readonly isUnknownRoot: boolean;
    readonly isInvalidMerkleRoots: boolean;
    readonly isInvalidNeighborWithdrawRoot: boolean;
    readonly isTooManyEdges: boolean;
    readonly isEdgeAlreadyExists: boolean;
    readonly isEdgeDoesntExists: boolean;
    readonly type: 'UnknownRoot' | 'InvalidMerkleRoots' | 'InvalidNeighborWithdrawRoot' | 'TooManyEdges' | 'EdgeAlreadyExists' | 'EdgeDoesntExists';
  }

  /** @name PalletMixerMixerMetadata (405) */
  export interface PalletMixerMixerMetadata extends Struct {
    readonly depositSize: u128;
    readonly asset: u32;
  }

  /** @name PalletMixerError (407) */
  export interface PalletMixerError extends Enum {
    readonly isInvalidPermissions: boolean;
    readonly isInvalidWithdrawProof: boolean;
    readonly isAlreadyRevealedNullifier: boolean;
    readonly isInvalidArbitraryData: boolean;
    readonly isUnknownRoot: boolean;
    readonly isNoMixerFound: boolean;
    readonly type: 'InvalidPermissions' | 'InvalidWithdrawProof' | 'AlreadyRevealedNullifier' | 'InvalidArbitraryData' | 'UnknownRoot' | 'NoMixerFound';
  }

  /** @name PalletAnchorAnchorMetadata (408) */
  export interface PalletAnchorAnchorMetadata extends Struct {
    readonly depositSize: u128;
    readonly asset: u32;
  }

  /** @name PalletAnchorError (409) */
  export interface PalletAnchorError extends Enum {
    readonly isInvalidMerkleRoots: boolean;
    readonly isUnknownRoot: boolean;
    readonly isInvalidWithdrawProof: boolean;
    readonly isNoAnchorFound: boolean;
    readonly isInvalidArbitraryData: boolean;
    readonly isAlreadyRevealedNullifier: boolean;
    readonly type: 'InvalidMerkleRoots' | 'UnknownRoot' | 'InvalidWithdrawProof' | 'NoAnchorFound' | 'InvalidArbitraryData' | 'AlreadyRevealedNullifier';
  }

  /** @name PalletAnchorHandlerUpdateRecord (411) */
  export interface PalletAnchorHandlerUpdateRecord extends Struct {
    readonly treeId: u32;
    readonly resourceId: U8aFixed;
    readonly edgeMetadata: PalletLinkableTreeEdgeMetadata;
  }

  /** @name PalletAnchorHandlerError (412) */
  export interface PalletAnchorHandlerError extends Enum {
    readonly isInvalidPermissions: boolean;
    readonly isResourceIsAlreadyAnchored: boolean;
    readonly isAnchorHandlerNotFound: boolean;
    readonly isSourceChainIdNotFound: boolean;
    readonly isStorageOverflow: boolean;
    readonly type: 'InvalidPermissions' | 'ResourceIsAlreadyAnchored' | 'AnchorHandlerNotFound' | 'SourceChainIdNotFound' | 'StorageOverflow';
  }

  /** @name PalletSignatureBridgeError (413) */
  export interface PalletSignatureBridgeError extends Enum {
    readonly isInvalidPermissions: boolean;
    readonly isInvalidChainId: boolean;
    readonly isChainNotWhitelisted: boolean;
    readonly isChainAlreadyWhitelisted: boolean;
    readonly isResourceDoesNotExist: boolean;
    readonly isSignatureInvalid: boolean;
    readonly isMustBeMaintainer: boolean;
    readonly isProposalAlreadyExists: boolean;
    readonly isCallNotConsistentWithProposalData: boolean;
    readonly isCallDoesNotMatchResourceId: boolean;
    readonly isIncorrectExecutionChainIdType: boolean;
    readonly isInvalidNonce: boolean;
    readonly type: 'InvalidPermissions' | 'InvalidChainId' | 'ChainNotWhitelisted' | 'ChainAlreadyWhitelisted' | 'ResourceDoesNotExist' | 'SignatureInvalid' | 'MustBeMaintainer' | 'ProposalAlreadyExists' | 'CallNotConsistentWithProposalData' | 'CallDoesNotMatchResourceId' | 'IncorrectExecutionChainIdType' | 'InvalidNonce';
  }

  /** @name SpRuntimeMultiSignature (415) */
  export interface SpRuntimeMultiSignature extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: SpCoreEd25519Signature;
    readonly isSr25519: boolean;
    readonly asSr25519: SpCoreSr25519Signature;
    readonly isEcdsa: boolean;
    readonly asEcdsa: SpCoreEcdsaSignature;
    readonly type: 'Ed25519' | 'Sr25519' | 'Ecdsa';
  }

  /** @name SpCoreSr25519Signature (416) */
  export interface SpCoreSr25519Signature extends U8aFixed {}

  /** @name SpCoreEcdsaSignature (417) */
  export interface SpCoreEcdsaSignature extends U8aFixed {}

  /** @name FrameSystemExtensionsCheckSpecVersion (420) */
  export type FrameSystemExtensionsCheckSpecVersion = Null;

  /** @name FrameSystemExtensionsCheckTxVersion (421) */
  export type FrameSystemExtensionsCheckTxVersion = Null;

  /** @name FrameSystemExtensionsCheckGenesis (422) */
  export type FrameSystemExtensionsCheckGenesis = Null;

  /** @name FrameSystemExtensionsCheckNonce (425) */
  export interface FrameSystemExtensionsCheckNonce extends Compact<u32> {}

  /** @name FrameSystemExtensionsCheckWeight (426) */
  export type FrameSystemExtensionsCheckWeight = Null;

  /** @name PalletTransactionPaymentChargeTransactionPayment (427) */
  export interface PalletTransactionPaymentChargeTransactionPayment extends Compact<u128> {}

  /** @name EggStandaloneRuntimeRuntime (428) */
  export type EggStandaloneRuntimeRuntime = Null;

} // declare module
