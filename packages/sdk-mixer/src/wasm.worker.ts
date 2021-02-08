import wasm, { Mixer } from '@webb-tools/mixer-client';
import type { TokenSymbol } from '@webb-tools/sdk-mixer/types';

type Asset = {
  id: number;
  tokenSymbol: TokenSymbol;
};
export type WasmWorkerMessageTX = {
  ready: void;
  generatedNote: {
    note: string;
  };
  deposit: {
    leaf: Uint8Array;
    note: string;
  };
};
export type WasmWorkerMessageRX = {
  generateNote: Asset;
  init: {
    mixerGroup: Array<[TokenSymbol, number, number]>;
  };
  deposit: {
    note?: string;
    asset?: Asset;
  };
  withdraw: {
    leaves: Array<Uint8Array>;
    root: Uint8Array;
    note: string;
  };
};
export type Event<T extends keyof WasmWorkerMessageTX = any> = {
  name: T;
  value: WasmWorkerMessageTX[T];
};

class MixerWasm {
  // @ts-ignore
  private mixer: Mixer | null = null;

  init(mixerGroup: Array<[TokenSymbol, number, number]>): void {
    this.mixer = wasm.Mixer.new(mixerGroup);
    this.emit('ready', undefined);
  }

  generateNote(asset: Asset) {
    if (!this.mixer) {
      // todo fix this
      return;
    }
    const note = this.mixer.generate_note(asset.tokenSymbol, asset.id);
    this.emit('generatedNote', {
      note: note
    });
  }

  deposit(noteSerialized?: string, assetSerialized?: Asset) {
    if (!this.mixer) {
      // todo fix this
      return;
    }
    type SavedNote = Map<'leaf' | 'asset' | 'id', any>;
    if (noteSerialized) {
      const note = this.mixer.save_note(noteSerialized) as SavedNote;
      const leaf = note.get('leaf') as Uint8Array;
      return this.emit('deposit', {
        leaf,
        note: noteSerialized
      });
    } else if (assetSerialized) {
      const note = this.mixer.generate_note(assetSerialized.tokenSymbol, assetSerialized.id);
      const savedNote = this.mixer.save_note(note) as SavedNote;
      const leaf = savedNote.get('leaf') as Uint8Array;
      return this.emit('deposit', {
        leaf,
        note
      });
    }
  }

  emit<T extends keyof WasmWorkerMessageTX>(name: T, value: WasmWorkerMessageTX[T]) {
    // @ts-ignore
    self.postMessage({
      name,
      value
    });
  }

  on(event: WasmWorkerMessageRX) {
    const name = Object.keys(event)[0] as keyof WasmWorkerMessageRX;
    switch (name) {
      case 'generateNote':
        this.generateNote(event[name]);
        break;
      case 'init':
        this.init(event[name].mixerGroup);
        break;
      case 'deposit':
        this.deposit(event[name].note, event[name].asset);
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
