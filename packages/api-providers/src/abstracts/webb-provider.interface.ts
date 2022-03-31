// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AnchorApi } from '@webb-tools/api-providers';
import { EventBus } from '@webb-tools/app-util';

import { AccountsAdapter } from '../account/Accounts.adapter';
import { InteractiveFeedback } from '../webb-error';
import { AnchorDeposit, AnchorWithdraw, Bridge } from './anchor';
import { ChainQuery } from './chain-query';
import { AppConfig } from './common';
import { DepositPayload, MixerDeposit, MixerDepositEvents, MixerWithdraw, MixerWithdrawEvents } from './mixer';
import { WebbRelayerBuilder } from './relayer';
import { WrapUnWrap } from './wrap-unwrap';

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
    inner: WrapUnWrap<T>;
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
   * */
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

export type NotificationData = {
  // Either the Notification is kept for future manual removal or by an event
  persist: boolean;
  // Main message/ title for the notification
  message: string;
  // Description about the Notification
  description: string;
  // Notification variant that can be used to style the notification
  variant: VariantType;
  // Arbitrary action that can be used  for clicking the notification (Not implemented)
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
// Transaction notification
export type TXNotification = {
  // Transaction status is in progress
  loading(payload: TXNotificationPayload<any>): NotificationKey;
  // Transaction failed
  failed(payload: TXNotificationPayload<any>): NotificationKey;
  // Transaction Done with success
  finalize(payload: TXNotificationPayload<any>): NotificationKey;
};
export type NotificationLevel = 'loading' | 'error' | 'success' | 'warning' | 'info';

export type NotificationPayload = {
  // Title of the notification
  message: string;
  // details about the notification
  description: string;
  // Event name/ event identifier
  name: 'Transaction' | 'Approval';
  // key for a given notification can be used to remove/dismiss a notification
  key: string;
  // level
  level: NotificationLevel;
  // Record for more metadata
  data?: Record<string, string>;
  // if true the notification will be dismissed by the user or with another action
  persist?: boolean;
};
// Function call to register a notification
export type NotificationHandler = ((notification: NotificationPayload) => string | number) & {
  // remove the notification programmatically
  remove(key: string | number): void;
};
/*
 * Wasm factory
 * @params
 * */
export type WasmFactory = (name?: string) => Worker | null;

export interface WebbApiProvider<T> extends EventBus<WebbProviderEvents> {
  /// Accounts Adapter will have all methods related to the provider accounts
  accounts: AccountsAdapter<any>;
  /// All of the available methods and api of the provider
  methods: WebbMethods<WebbApiProvider<T>>;

  /// A hook will be called to drop the provider and do cleanup listeners etc..
  destroy(): Promise<void> | void;

  capabilities?: ProvideCapabilities;
  // Clean up for the provider that will remove the side effects
  endSession?(): Promise<void>;

  /// relayer
  relayingManager: WebbRelayerBuilder;

  getProvider(): any;

  // Configs
  config: AppConfig;
  // Notification handler
  notificationHandler: NotificationHandler;
  // wasm-utils workers factory
  wasmFactory: WasmFactory;
}
