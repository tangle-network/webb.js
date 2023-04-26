// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { LoggerService } from '../logger';

type Obj = Record<string, unknown>;
export type EventRX<T extends Record<string, unknown>> = {
  name: keyof T;
  value: T[keyof T];
};
export type EventTX<T extends Record<string, unknown>> = {
  name: keyof T;
  value: T[keyof T];

  error: boolean;
};

export type TX<TxPayload extends Obj> = EventTX<TxPayload>;

export abstract class WorkerWithEvents<
  EventNames extends keyof any,
  TxPayload extends Record<EventNames, unknown>,
  RxPayload extends Record<EventNames, unknown>
> {
  protected abstract Logger: LoggerService;

  constructor () {
    (self as unknown as Worker).addEventListener('message', (event) => {
      this.on(event.data as unknown as RxPayload);
    });
  }

  protected abstract eventHandler<Name extends keyof RxPayload>(name: Name, value: RxPayload[Name]): void;

  protected on (event: RxPayload): void {
    const name = Object.keys(event)[0] as keyof RxPayload;

    this.Logger.trace(`Got message  ${String(name)} `, event);
    this.eventHandler(name, event[name]);
  }

  protected emit<Name extends keyof TxPayload> (name: Name, value: TxPayload[Name], error = false): void {
    this.Logger.trace(`Got message ${String(name)}`, value);
    const worker = self as unknown as Worker;
    const message: TX<TxPayload> = {
      error,
      name,
      value
    };

    worker.postMessage(message);
  }
}
