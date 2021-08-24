import { LoggerService } from '../logger';

export type EventRX<T extends Record<string, unknown>> = {
  name: keyof T;
  value: T[keyof T];
};
export type EventTX<T extends Record<string, unknown>> = {
  name: keyof T;
  value: T[keyof T];

  error: boolean;
};

type RX<RxPayload> = EventTX<RxPayload>;
type TX<TxPayload> = EventRX<TxPayload>;

export abstract class WorkerWithEvents<
  EventNames extends keyof any,
  TxPayload extends Record<EventNames, unknown>,
  RxPayload extends Record<EventNames, unknown>
> {
  protected abstract Logger: LoggerService;

  constructor() {
    ((self as unknown) as Worker).addEventListener('message', (event) => {
      this.on((event.data as unknown) as RX<RxPayload>);
    });
  }

  protected abstract eventHandler<Name extends keyof RxPayload>(name: Name, value: RxPayload[Name]): void;

  protected on(event: RX<RxPayload>): void {
    const name = Object.keys(event)[0] as EventNames;
    this.Logger.trace(`Got message  ${name} `, event);
    this.eventHandler(name, event.value);
  }

  protected emit<Name extends keyof TxPayload>(name: Name, value: TxPayload[Name], error = false): void {
    this.Logger.trace(`Got message ${name}`, value);
    const worker = (self as unknown) as Worker;
    worker.postMessage({
      name,
      value,
      error
    });
  }
}
