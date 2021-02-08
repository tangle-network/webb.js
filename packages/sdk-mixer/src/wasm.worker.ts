import wasm, { Mixer } from '@webb-tools/mixer-client';
import type { TokenSymbol } from '@webb-tools/sdk-mixer/types';

export type WasmWorkerMessageTX = {
  ready: void;
  generatedNote: {
    note: string;
  };
  deposit: {
    left: Uint8Array;
  };
};
export type WasmWorkerMessageRX = {
  generateNote: {
    id: number;
    tokenSymbol: TokenSymbol;
  };
  init: {
    mixerGroup: Array<[TokenSymbol, number, number]>;
  };
  deposit: {
    note: string;
  };
  withdraw: {
    leaves: Array<Uint8Array>;
    root: Uint8Array;
    note: string;
  };
};
export type Event<T extends keyof WasmWorkerMessageRX = any> = {
  name: T;
  data: WasmWorkerMessageRX[T];
};
class MixerWasm {
  // @ts-ignore
  private mixer: Mixer | null = null;

  init(mixerGroup: Array<[TokenSymbol, number, number]>): void {
    this.mixer = wasm.Mixer.new(mixerGroup);
    this.emit('ready', undefined);
  }

  emit<T extends keyof WasmWorkerMessageTX>(name: T, data: WasmWorkerMessageTX[T]) {
    // @ts-ignore
    self.postMessage({
      name,
      data
    });
  }

  on(event: WasmWorkerMessageRX) {
    const name = Object.keys(event)[0] as keyof WasmWorkerMessageRX;
    switch (name) {
      case 'generateNote':
        break;
      case 'init':
        this.init(event[name].mixerGroup);
        break;
      case 'deposit':
        break;
      case 'withdraw':
        break;
    }
  }
}

const worker = new MixerWasm();
self.addEventListener('message', (event) => {
  worker.on((event.data as unknown) as WasmWorkerMessageRX);
});
