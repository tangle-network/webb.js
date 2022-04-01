// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { WebbApiProvider } from '@webb-tools/api-providers/index.js';
import { EventBus } from '@webb-tools/app-util/index.js';
import { Note } from '@webb-tools/sdk-core/index.js';
import { BehaviorSubject, Observable } from 'rxjs';

import { InternalChainId } from '../../chains/index.js';
import { ActiveWebbRelayer, WebbRelayer } from '../relayer/index.js';

export enum WithdrawState {
  Cancelling, // Withdraw canceled
  Ideal, // initial status where the instance is Idea and ready for a withdraw

  GeneratingZk, // There is a withdraw in progress, and it's on the step of generating the Zero-knowledge proof

  SendingTransaction, // There is a withdraw in progress, and it's on the step Sending the Transaction whether directly or through relayers

  Done, // the withdraw is Done and seceded , the next tic the instance should be ideal
  Failed // the withdraw is Done with a failure, the next tic the instance should be ideal
}

// Events that can be emitted using the {EventBus}
export type MixerWithdrawEvents = {
  // Generic Error by the provider or doing an intermediate step
  error: string;
  // Validation Error for the withdrawing note
  // TODO : update this to be more verbose and not just relate to the note but also the params for `generateNote` and `withdraw`
  validationError: {
    note: string;
    recipient: string;
  };
  // The instance State change event to track the current status of the instance
  stateChange: WithdrawState;
  // the instance is ready
  ready: void;
  loading: boolean;
};
export type OptionalRelayer = null | WebbRelayer;
export type OptionalActiveRelayer = null | ActiveWebbRelayer;
export type CancelToken = {
  cancelled: boolean;
};

/**
 * Mixer withdraw abstract
 * The underlying method should be implemented to  get a functioning mixerWithdraw for a {WebbApiProvider}
 * @param {T} the provider WebbApiProvider
 */
export abstract class MixerWithdraw<T extends WebbApiProvider<any>> extends EventBus<MixerWithdrawEvents> {
  state: WithdrawState = WithdrawState.Ideal;
  protected emitter = new BehaviorSubject<OptionalActiveRelayer>(null);
  readonly watcher: Observable<OptionalActiveRelayer>;
  private _activeRelayer: OptionalActiveRelayer = null;
  cancelToken: CancelToken = { cancelled: false };

  constructor (protected inner: T) {
    super();
    this.watcher = this.emitter.asObservable();
  }

  // Whether  there is an active relayer
  get hasRelayer (): Promise<boolean> {
    return Promise.resolve(false);
  }

  // Getter for the active relayer First arg of the tuple will be the OptionalActiveRelayer, the other one is a watcher
  get activeRelayer (): [OptionalActiveRelayer, Observable<OptionalActiveRelayer>] {
    return [this._activeRelayer, this.watcher];
  }

  /**
   * This is a default implemented function that must be overridden if the instance is meant to use the relayer
   * It maps a relayer to the active relayer type that can be used for relaying withdrawing
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapRelayerIntoActive (relayer: OptionalRelayer): Promise<OptionalActiveRelayer> {
    return Promise.resolve(null);
  }

  /**
   * Set/unset the active relayer
   * */
  public async setActiveRelayer (relayer: OptionalRelayer) {
    this._activeRelayer = await this.mapRelayerIntoActive(relayer);
    this.emitter.next(this._activeRelayer);
  }

  // todo switch to the reactive api
  get relayers (): Promise<WebbRelayer[]> {
    return Promise.resolve([]);
  }

  /**
   * This is a default implemented function that must be overridden if the instance is meant to use the relayer
   * It will get a relayer by the note mapping  with relayers capabilities
   *
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRelayersByNote (note: Note): Promise<WebbRelayer[]> {
    return Promise.resolve([]);
  }

  /**
   * This is a default implemented function that must be overridden if the instance is meant to use the relayer
   * It will get a relayer by the chain id and contract-address/tree-id  mapping the note metadata with relayers capabilities
   *
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRelayersByChainAndAddress (chainId: InternalChainId, address: string): Promise<WebbRelayer[]> {
    return Promise.resolve([]);
  }

  /**
   *  cancel the withdraw */
  cancelWithdraw (): Promise<void> {
    this.cancelToken.cancelled = true;
    this.emit('stateChange', WithdrawState.Cancelling);

    return Promise.resolve(undefined);
  }

  /**
   * This should be implemented to do the Transaction call for the withdraw
   * it should do the side effects on the instance
   * - Mutate the {loading} status of the instance
   * - Use the event bus to emit the status of the transaction
   * - Switch logic for relayer usage
   * */
  abstract withdraw(note: string, recipient: string): Promise<string>;
}
