// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AppConfig, InternalChainId } from '@webb-tools/api-providers/index.js';
import { Note } from '@webb-tools/sdk-core/index.js';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { RelayerQuery } from './types.js';
import { OptionalActiveRelayer, OptionalRelayer, WebbRelayer } from './webb-relayer.js';

export abstract class WebbRelayerManager {
  private activeRelayerSubject = new BehaviorSubject<OptionalActiveRelayer>(null);
  readonly activeRelayerWatcher: Observable<OptionalActiveRelayer>;
  private _listUpdated = new Subject<void>();
  public readonly listUpdated: Observable<void>;
  protected relayers: WebbRelayer[];
  protected config: AppConfig;
  public activeRelayer: OptionalActiveRelayer = null;

  constructor (relayers: WebbRelayer[], config: AppConfig) {
    this.relayers = relayers;
    this.config = config;
    this.activeRelayerWatcher = this.activeRelayerSubject.asObservable();
    this.listUpdated = this._listUpdated.asObservable();
  }

  async setActiveRelayer (relayer: WebbRelayer, internalChainId: InternalChainId): Promise<void> {
    const active = await this.mapRelayerIntoActive(relayer, internalChainId);

    this.activeRelayer = active;
    this.activeRelayerSubject.next(active);
  }

  abstract mapRelayerIntoActive (relayer: OptionalRelayer, internalChainId: InternalChainId): Promise<OptionalActiveRelayer>;

  /*
   *  get a list of the suitable relayers for a given query
   *  the list is randomized
   *  Accepts a 'RelayerQuery' object with optional, indexible fields.
   **/
  abstract getRelayers (query: RelayerQuery): WebbRelayer[];
  abstract getRelayersByNote (note: Note): Promise<WebbRelayer[]>;
  abstract getRelayersByChainAndAddress (chainId: InternalChainId, address: string): Promise<WebbRelayer[]>;
}