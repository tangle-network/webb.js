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

export abstract class WorkerWithEvents<
  EventNames extends keyof any,
  TxPayload extends Record<EventNames, unknown>,
  RxPayload extends Record<EventNames, unknown>,
  RX = EventTX<RxPayload>,
  TX = EventRX<RxPayload>
> {
  protected abstract Logger: LoggerService;

  constructor() {
    ((self as unknown) as Worker).addEventListener('message', (event) => {
      this.on((event.data as unknown) as RX);
    });
  }

  protected abstract eventHandler<Name extends keyof RX>(name: Name, value: RX[Name]): void;

  protected on(event: RX): void {
    const name = Object.keys(event)[0] as keyof RX;
    this.Logger.trace(`Got message  ${name} `, event);
    this.eventHandler(name, event[name]);
  }

  protected emit<Name extends keyof TX>(name: Name, value: TX[Name], error = false): void {
    this.Logger.trace(`Got message ${name}`, value);
    const worker = (self as unknown) as Worker;
    worker.postMessage({
      name,
      value,
      error
    });
  }
}
