import { LoggerService } from '@webb-tools/app-util';
import { PoseidonHasher } from 'rust/pkg/mixer-client';

export type Events = 'poseidon' | 'hash';
export type WasmMessage = Record<Events, unknown>;

export interface WasmWorkerMessageTX extends WasmMessage {
  init: void;
  poseidon: {
    hash: Uint8Array;
  };
}

export interface WasmWorkerMessageRX extends WasmMessage {
  init: {
    bulletproofGens: Uint8Array;
  };
  poseidon: {
    left: Uint8Array;
    right: Uint8Array;
  };
}

export type Event<T extends keyof WasmWorkerMessageTX = any> = {
  name: T;
  value: WasmWorkerMessageTX[T];
  error: boolean;
};

export type EventRX<T extends keyof WasmWorkerMessageRX = any> = {
  name: T;
  value: WasmWorkerMessageRX[T];
};

export class WasmPoseidonHash {
  // private hasher: PoseidonHasher;
  private logger = LoggerService.new('WasmPoseidonHash');

  constructor() {
    self.addEventListener('message', (event) => {
      this.on((event.data as unknown) as WasmWorkerMessageRX);
    });
  }

  init(bulletproofGens?: Uint8Array): void {
    import('@webb-tools/mixer-client')
      .then((wasm) => {
        const opts = new wasm.PoseidonHasherOptions();
        if (bulletproofGens && bulletproofGens.length !== 0) {
          opts.bp_gens = bulletproofGens;
        }
        // this.hasher = new wasm.PoseidonHasher(opts);
        this.logger.debug('Poseidon hasher initialized');
        this.emit('init', undefined);
      })
      .catch((e) => {
        this.logger.error(`Failed to initialized the mixer`, e);
        this.emit('init', e, true);
      });
  }

  poseidon(left: Uint8Array, right: Uint8Array): void {
    try {
      // const hash = this.PoseidonHasher.hash(left, right);
      // this.emit('poseidon', {
      //   hash
      // });
    } catch (e) {
      this.emit('poseidon', e, true);
    }
  }

  emit<T extends keyof WasmWorkerMessageTX, V extends WasmWorkerMessageTX[T] | string>(
    name: T,
    value: V,
    error = false
  ): void {
    this.logger.trace(`Got message ${name}`, value);
    const worker = (self as unknown) as Worker;
    worker.postMessage({
      name,
      value,
      error
    });
  }

  on(event: WasmWorkerMessageRX): void {
    const name = Object.keys(event)[0] as keyof WasmWorkerMessageRX;
    this.logger.trace(`Got message  ${name} `, event);
    switch (name) {
      case 'poseidon':
        this.poseidon(event[name].left, event[name].right);
        break;
    }
  }
}
