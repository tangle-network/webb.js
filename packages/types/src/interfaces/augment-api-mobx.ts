// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Bytes, Option, Vec, bool, u32, u64 } from '@polkadot/types';
import type { AnyNumber, ITuple } from '@polkadot/types/types';
import type { AccountData, BalanceLock } from '@polkadot/types/interfaces/balances';
import type { CodeHash, ContractInfo, DeletedContract, PrefabWasmModule, Schedule } from '@polkadot/types/interfaces/contracts';
import type { EthBlock, EthReceipt, EthTransaction, EthTransactionStatus } from '@polkadot/types/interfaces/eth';
import type { SetId, StoredPendingChange, StoredState } from '@polkadot/types/interfaces/grandpa';
import type { SessionIndex } from '@polkadot/types/interfaces/session';
import type { AccountInfo, ConsumedWeight, DigestOf, EventIndex, EventRecord, LastRuntimeUpgradeInfo, Phase } from '@polkadot/types/interfaces/system';
import type { Multiplier } from '@polkadot/types/interfaces/txpayment';
import type { GroupId, GroupTree, Manager } from '@webb-tools/types/interfaces/merkle';
import type { CurrencyId, MixerInfo, ScalarData } from '@webb-tools/types/interfaces/mixer';
import type { AccountId, Balance, BalanceOf, BlockNumber, H160, H256, Hash, Moment, Releases } from '@webb-tools/types/interfaces/runtime';
import type { BaseStorageType, StorageDoubleMap, StorageMap } from '@open-web3/api-mobx';

export interface StorageType extends BaseStorageType {
  balances: {    /**
     * The balance of an account.
     * 
     * NOTE: This is only used in the case that this pallet is used to store balances.
     **/
    account: StorageMap<AccountId | string, AccountData>;
    /**
     * Any liquidity locks on some account balances.
     * NOTE: Should only be accessed when setting, changing and freeing a lock.
     **/
    locks: StorageMap<AccountId | string, Vec<BalanceLock>>;
    /**
     * Storage version of the pallet.
     * 
     * This is set to v2.0.0 for new networks.
     **/
    storageVersion: Releases | null;
    /**
     * The total units issued in the system.
     **/
    totalIssuance: Balance | null;
  };
  contracts: {    /**
     * The subtrie counter.
     **/
    accountCounter: u64 | null;
    /**
     * A mapping between an original code hash and instrumented wasm code, ready for execution.
     **/
    codeStorage: StorageMap<CodeHash | string, Option<PrefabWasmModule>>;
    /**
     * The code associated with a given account.
     * 
     * TWOX-NOTE: SAFE since `AccountId` is a secure hash.
     **/
    contractInfoOf: StorageMap<AccountId | string, Option<ContractInfo>>;
    /**
     * Current cost schedule for contracts.
     **/
    currentSchedule: Schedule | null;
    /**
     * Evicted contracts that await child trie deletion.
     * 
     * Child trie deletion is a heavy operation depending on the amount of storage items
     * stored in said trie. Therefore this operation is performed lazily in `on_initialize`.
     **/
    deletionQueue: Vec<DeletedContract> | null;
    /**
     * A mapping from an original code hash to the original code, untouched by instrumentation.
     **/
    pristineCode: StorageMap<CodeHash | string, Option<Bytes>>;
  };
  currencies: {  };
  ethereum: {    /**
     * The current Ethereum block.
     **/
    currentBlock: Option<EthBlock> | null;
    /**
     * The current Ethereum receipts.
     **/
    currentReceipts: Option<Vec<EthReceipt>> | null;
    /**
     * The current transaction statuses.
     **/
    currentTransactionStatuses: Option<Vec<EthTransactionStatus>> | null;
    /**
     * Current building block's transactions and receipts.
     **/
    pending: Vec<ITuple<[EthTransaction, EthTransactionStatus, EthReceipt]>> | null;
  };
  evm: {    accountCodes: StorageMap<H160 | string, Bytes>;
    accountStorages: StorageDoubleMap<H160 | string, H256 | string, H256>;
  };
  grandpa: {    /**
     * The number of changes (both in terms of keys and underlying economic responsibilities)
     * in the "set" of Grandpa validators from genesis.
     **/
    currentSetId: SetId | null;
    /**
     * next block number where we can force a change.
     **/
    nextForced: Option<BlockNumber> | null;
    /**
     * Pending change: (signaled at, scheduled change).
     **/
    pendingChange: Option<StoredPendingChange> | null;
    /**
     * A mapping from grandpa set ID to the index of the *most recent* session for which its
     * members were responsible.
     * 
     * TWOX-NOTE: `SetId` is not under user control.
     **/
    setIdSession: StorageMap<SetId | AnyNumber, Option<SessionIndex>>;
    /**
     * `true` if we are currently stalled.
     **/
    stalled: Option<ITuple<[BlockNumber, BlockNumber]>> | null;
    /**
     * State of the current authority set.
     **/
    state: StoredState | null;
  };
  merkle: {    /**
     * Map of cached/past Merkle roots at each block number and group. There
     * can be more than one root update in a single block. Allows for easy
     * pruning since we can remove all keys of the first map past a certain
     * point.
     **/
    cachedRoots: StorageDoubleMap<BlockNumber | AnyNumber, GroupId | AnyNumber, Vec<ScalarData>>;
    /**
     * The map of groups to their metadata
     **/
    groups: StorageMap<GroupId | AnyNumber, Option<GroupTree>>;
    /**
     * Block number of the newest set of roots that we are caching
     **/
    highestCachedBlock: BlockNumber | null;
    /**
     * Block number of the oldest set of roots that we are caching
     **/
    lowestCachedBlock: BlockNumber | null;
    /**
     * Maps tree id to the manager of the tree
     **/
    managers: StorageMap<GroupId | AnyNumber, Option<Manager>>;
    /**
     * Old name generated by `decl_event`.
     * The next group identifier up for grabs
     **/
    nextGroupId: GroupId | null;
    /**
     * Indicates whether the group tree is stopped or not
     **/
    stopped: StorageMap<GroupId | AnyNumber, bool>;
    /**
     * Map of used nullifiers for each tree.
     **/
    usedNullifiers: StorageMap<ITuple<[GroupId, ScalarData]> | [GroupId | AnyNumber, ScalarData | string], bool>;
  };
  mixer: {    /**
     * Administrator of the mixer pallet.
     * This account that can stop/start operations of the mixer
     **/
    admin: AccountId | null;
    /**
     * Flag indicating if the mixer is initialized
     **/
    initialised: bool | null;
    /**
     * The vector of group ids
     **/
    mixerGroupIds: Vec<GroupId> | null;
    /**
     * The map of mixer groups to their metadata
     **/
    mixerGroups: StorageMap<GroupId | AnyNumber, MixerInfo>;
    /**
     * The TVL per group
     **/
    totalValueLocked: StorageMap<GroupId | AnyNumber, BalanceOf>;
  };
  randomnessCollectiveFlip: {    /**
     * Series of block headers from the last 81 blocks that acts as random seed material. This
     * is arranged as a ring buffer with `block_number % 81` being the index into the `Vec` of
     * the oldest hash.
     **/
    randomMaterial: Vec<Hash> | null;
  };
  sudo: {    /**
     * The `AccountId` of the sudo key.
     **/
    key: AccountId | null;
  };
  system: {    /**
     * The full account information for a particular account ID.
     **/
    account: StorageMap<AccountId | string, AccountInfo>;
    /**
     * Total length (in bytes) for all extrinsics put together, for the current block.
     **/
    allExtrinsicsLen: Option<u32> | null;
    /**
     * Map of block numbers to block hashes.
     **/
    blockHash: StorageMap<BlockNumber | AnyNumber, Hash>;
    /**
     * The current weight for the block.
     **/
    blockWeight: ConsumedWeight | null;
    /**
     * Digest of the current block, also part of the block header.
     **/
    digest: DigestOf | null;
    /**
     * The number of events in the `Events<T>` list.
     **/
    eventCount: EventIndex | null;
    /**
     * Events deposited for the current block.
     **/
    events: Vec<EventRecord> | null;
    /**
     * Mapping between a topic (represented by T::Hash) and a vector of indexes
     * of events in the `<Events<T>>` list.
     * 
     * All topic vectors have deterministic storage locations depending on the topic. This
     * allows light-clients to leverage the changes trie storage tracking mechanism and
     * in case of changes fetch the list of events of interest.
     * 
     * The value has the type `(T::BlockNumber, EventIndex)` because if we used only just
     * the `EventIndex` then in case if the topic has the same contents on the next block
     * no notification will be triggered thus the event might be lost.
     **/
    eventTopics: StorageMap<Hash | string, Vec<ITuple<[BlockNumber, EventIndex]>>>;
    /**
     * The execution phase of the block.
     **/
    executionPhase: Option<Phase> | null;
    /**
     * Total extrinsics count for the current block.
     **/
    extrinsicCount: Option<u32> | null;
    /**
     * Extrinsics data for the current block (maps an extrinsic's index to its data).
     **/
    extrinsicData: StorageMap<u32 | AnyNumber, Bytes>;
    /**
     * Stores the `spec_version` and `spec_name` of when the last runtime upgrade happened.
     **/
    lastRuntimeUpgrade: Option<LastRuntimeUpgradeInfo> | null;
    /**
     * The current block number being processed. Set by `execute_block`.
     **/
    number: BlockNumber | null;
    /**
     * Hash of the previous block.
     **/
    parentHash: Hash | null;
    /**
     * True if we have upgraded so that AccountInfo contains two types of `RefCount`. False
     * (default) if not.
     **/
    upgradedToDualRefCount: bool | null;
    /**
     * True if we have upgraded so that `type RefCount` is `u32`. False (default) if not.
     **/
    upgradedToU32RefCount: bool | null;
  };
  timestamp: {    /**
     * Did the timestamp get updated in this block?
     **/
    didUpdate: bool | null;
    /**
     * Current time for the current block.
     **/
    now: Moment | null;
  };
  tokens: {    /**
     * The balance of a token type under an account.
     * 
     * NOTE: If the total is ever zero, decrease account ref account.
     * 
     * NOTE: This is only used in the case that this module is used to store
     * balances.
     **/
    accounts: StorageDoubleMap<AccountId | string, CurrencyId | { Token: any } | { DEXShare: any } | { ERC20: any } | string, AccountData>;
    /**
     * Any liquidity locks of a token type under an account.
     * NOTE: Should only be accessed when setting, changing and freeing a lock.
     **/
    locks: StorageDoubleMap<AccountId | string, CurrencyId | { Token: any } | { DEXShare: any } | { ERC20: any } | string, Vec<BalanceLock>>;
    /**
     * The total issuance of a token type.
     **/
    totalIssuance: StorageMap<CurrencyId | { Token: any } | { DEXShare: any } | { ERC20: any } | string, Balance>;
  };
  transactionPayment: {    nextFeeMultiplier: Multiplier | null;
    storageVersion: Releases | null;
  };
}
