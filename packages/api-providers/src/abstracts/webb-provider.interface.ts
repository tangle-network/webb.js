// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AnchorApi } from '@webb-tools/api-providers/index.js';
import { EventBus } from '@webb-tools/app-util/index.js';

import { AccountsAdapter } from '../account/Accounts.adapter.js';
import { InteractiveFeedback } from '../webb-error/index.js';
import { AnchorDeposit, AnchorWithdraw, Bridge } from './anchor/index.js';
import { ChainQuery } from './chain-query/index.js';
import { DepositPayload, MixerDeposit, MixerDepositEvents, MixerWithdraw, MixerWithdrawEvents } from './mixer/index.js';
import { WebbRelayerBuilder } from './relayer/index.js';
import { WrapUnwrap } from './wrap-unwrap/index.js';
import { AppConfig } from './common.js';

/// list of the apis that are available for  the provider
export interface WebbMethods<T extends WebbApiProvider<any>> {
  // Mixer API
  mixer: WebbMixer<T>;
  // Anchor/Bridge API
  anchor: WebbAnchor<T>;
  // Wrap and unwrap API
  wrapUnwrap: WrapAndUnwrap<T>;
  // Chain query : an API for querying storage used currently for balances
  chainQuery: ChainQuery<T>;
  // Anchor API developed initially for to handle the difference between
  // web3 (Chains that depend on static configs) and chains that will need to query the anchor
  anchorApi: AnchorApi<T, any>;
}

export type WebbMethod<T extends EventBus<K>, K extends Record<string, unknown>> = {
  // The underlying provider for the methods
  inner: T;
  enabled: boolean;
};

export interface WebbMixer<T extends WebbApiProvider<any>> {
  // deposit
  deposit: WebbMethod<MixerDeposit<T, DepositPayload>, MixerDepositEvents>;
  // withdraw
  withdraw: WebbMethod<MixerWithdraw<T>, MixerWithdrawEvents>;
}

export interface WrapAndUnwrap<T> {
  core: {
    inner: WrapUnwrap<T>;
    enabled: boolean;
  };
}

export interface WebbAnchor<T extends WebbApiProvider<any>> {
  core: Bridge | null;
  // deposit
  deposit: WebbMethod<AnchorDeposit<T, DepositPayload>, MixerDepositEvents>;
  // withdraw
  withdraw: WebbMethod<AnchorWithdraw<T>, MixerWithdrawEvents>;
}

/// TODO improve this and add a spec
/// An interface for Apis pre-initialization
export type ApiInitHandler = {
  /// an error handler for the Api before init
  /*
   * For instance Polkadot provider the dApp will prepare the parameters for the provider
   * This process may have an error
   **/
  onError(error: InteractiveFeedback): any;
};

export type WebbProviderEvents<T = any> = {
  /// event is trigger to show an interactiveFeedback related to the provider
  interactiveFeedback: InteractiveFeedback;
  /// The provider is updated and an action is required to handle this update
  providerUpdate: T;
  // /// accountsChange
  newAccounts: AccountsAdapter<any>;
};

export type ProvideCapabilities = {
  addNetworkRpc: boolean;
  listenForAccountChange: boolean;
  listenForChainChane: boolean;
  hasSessions: boolean;
};

export type NotificationKey = string | number;
export type VariantType = 'default' | 'error' | 'success' | 'warning' | 'info';
/**
 * Notification data
 *
 * @param persist - Either the Notification is kept for future manual removal or by an event
 * @param message - Main message/ title for the notification
 * @param description - Description about the Notification
 * @param variant - Notification variant that can be used to style the notification
 * @param action - Arbitrary action that can be used  for clicking the notification (Not implemented)
 **/
export type NotificationData = {
  persist: boolean;
  message: string;
  description: string;
  variant: VariantType;
  action: string;
};

export type NotificationApi = {
  addToQueue(data: NotificationData): NotificationKey;
  remove(key: NotificationKey): void;
};
type MethodPath = {
  // Main section for the Transaction
  section: string;
  // The call name
  method: string;
};

export type TXNotificationPayload<T = undefined> = {
  // Generic data for the transaction payload
  data: T;
  // notification key
  key: NotificationKey;
  address: string;
  // More metadata for the transaction path (EX Anchor::Deposit ,VAnchor::Withdraw)
  path: MethodPath;
};
/**
 * Transaction notification provider
 *
 * @param loading - Transaction status is in progress
 * @param failed - Transaction failed
 * @param finalize - Transaction Done with success
 **/
export type TXNotification = {
  loading(payload: TXNotificationPayload<any>): NotificationKey;
  failed(payload: TXNotificationPayload<any>): NotificationKey;
  finalize(payload: TXNotificationPayload<any>): NotificationKey;
};
export type NotificationLevel = 'loading' | 'error' | 'success' | 'warning' | 'info';
/**
 * Notification emitted from the webb provider
 *
 * @param message - Title of the notification
 * @param description - details about the notification
 * @param name - Event name/ event identifier
 * @param key - key for a given notification can be used to remove/dismiss a notification
 * @param level - level
 * @param data - Record for more metadata
 * @param persist - if true the notification will be dismissed by the user or with another action
 **/
export type NotificationPayload = {
  message: string;
  description: string;
  name: 'Transaction' | 'Approval';
  key: string;
  level: NotificationLevel;
  data?: Record<string, string>;
  persist?: boolean;
};
// Function call to register a notification
export type NotificationHandler = ((notification: NotificationPayload) => string | number) & {
  // remove the notification programmatically
  remove(key: string | number): void;
};
/**
 * Wasm factory
 * @param name - optional name to map an action to a worker currently there's only sdk-core
 **/
export type WasmFactory = (name?: string) => Worker | null;

/**
 * The representation of an api provider
 *
 * @param accounts - Accounts Adapter will have all methods related to the provider accounts.
 * @param methods - All of the available methods  of the API provider.
 * @param destroy -  A hook will be called to drop the provider and do cleanup listeners etc.
 * @param capabilities - Manifesto of the supported actions of the provider.
 * @param endSession - Clean up for the provider that will remove the side effects.
 * @param relayingManager - Object used by the provider for sending transactions or queries to a compatible relayer.
 * @param getProvider - A getter method for getting the underlying provider
 * @param notificationHandler - Function for emitting notification of the current provider process
 * @param wasmFactory - Provider of the wasm workers
 *
 **/
export interface WebbApiProvider<T> extends EventBus<WebbProviderEvents> {
  accounts: AccountsAdapter<any>;
  methods: WebbMethods<WebbApiProvider<T>>;

  destroy(): Promise<void> | void;

  capabilities?: ProvideCapabilities;

  endSession?(): Promise<void>;

  relayingManager: WebbRelayerBuilder;

  getProvider(): any;

  // Configs
  config: AppConfig;
  // Notification handler
  notificationHandler: NotificationHandler;
  // wasm-utils workers factory
  wasmFactory: WasmFactory;
}