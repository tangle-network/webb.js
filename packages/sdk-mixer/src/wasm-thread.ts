import type { Mixer } from '@webb-tools/mixer-client';
import type { TokenSymbol } from '@webb-tools/sdk-mixer';
import { Note } from '@webb-tools/sdk-mixer';
import { LoggerService } from '@webb-tools/app-util';

type Asset = {
  id: number;
  tokenSymbol: TokenSymbol;
};
export type Events = 'init' | 'generateNote' | 'deposit' | 'withdraw';
export type WasmMessage = Record<Events, unknown>;

export interface WasmWorkerMessageTX extends WasmMessage {
  init: void;
  generateNote: {
    note: string;
  };
  deposit: {
    leaf: Uint8Array;
    note: string;
  };
  withdraw: {
    leafIndexCommitments: Array<Uint8Array>;
    commitments: Array<Uint8Array>;
    proofCommitments: Array<Uint8Array>;
    nullifierHash: Uint8Array;
    proof: Uint8Array;
  };
}

export interface WasmWorkerMessageRX extends WasmMessage {
  generateNote: Asset;
  init: {
    mixerGroup: Array<[TokenSymbol, number, number]>;
  };
  deposit: {
    note?: string;
    asset?: Asset;
  };
  withdraw: {
    mixerGroup: Array<[TokenSymbol, number, number]>;
    leaves: Array<Uint8Array>;
    root: Uint8Array;
    note: string;
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

export class WasmMixer {
  private mixer: Mixer | null = null;
  private logger = LoggerService.new('WasmMixer');
  constructor() {
    self.addEventListener('message', (event) => {
      this.on((event.data as unknown) as WasmWorkerMessageRX);
    });
  }

  init(mixerGroup: Array<[TokenSymbol, number, number]>): void {
    import('@webb-tools/mixer-client')
      .then((wasm) => {
        this.logger.debug('Mixer initializing with mixerGroup ', mixerGroup);
        this.mixer = wasm.Mixer.new(mixerGroup);
        this.logger.debug('Mixer initialized with mixerGroup ', mixerGroup);
        this.emit('init', undefined);
      })
      .catch((e) => {
        this.logger.error(`Failed to initialized the mixer`, e);
        this.emit('init', e, true);
      });
  }

  generateNote(asset: Asset): void {
    if (!this.mixer) {
      this.emit('generateNote', 'Mixer is not initialized', true);
      return;
    }
    try {
      const note = this.mixer.generate_note(asset.tokenSymbol, asset.id);
      this.emit('generateNote', {
        note
      });
    } catch (e) {
      this.emit('generateNote', e, true);
    }
  }

  deposit(noteSerialized?: string, assetSerialized?: Asset): void {
    if (!this.mixer) {
      this.emit('deposit', 'Mixer is not initialized', true);
      return;
    }
    try {
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
    } catch (e) {
      this.emit('deposit', e, true);
    }
  }

  withdraw(
    mixerGroup: Array<[TokenSymbol, number, number]>,
    note: string,
    root: Uint8Array,
    leaves: Array<Uint8Array>
  ): void {
    if (!this.mixer) {
      this.emit('withdraw', 'Mixer is not initialized', true);
      return;
    }
    try {
      type ZKProofMap = Map<'comms' | 'nullifier_hash' | 'leaf_index_comms' | 'proof_comms' | 'proof', unknown>;
      const mynote = Note.deserialize(note);
      import('@webb-tools/mixer-client')
        .then((wasm) => {
          this.logger.debug('Created a new Mixer for Withdrawer..');
          const mixer = wasm.Mixer.new(mixerGroup);
          mixer.add_leaves(mynote.tokenSymbol, mynote.id, leaves);
          const savedNote = mixer.save_note(note);
          const leaf = savedNote.get('leaf') as Uint8Array;
          const zkProofMap = mixer.generate_proof(mynote.tokenSymbol, mynote.id, root, leaf) as ZKProofMap;
          this.emit('withdraw', {
            leafIndexCommitments: zkProofMap.get('leaf_index_comms') as Array<Uint8Array>,
            commitments: zkProofMap.get('comms') as Array<Uint8Array>,
            proofCommitments: zkProofMap.get('proof_comms') as Array<Uint8Array>,
            proof: zkProofMap.get('proof') as Uint8Array,
            nullifierHash: zkProofMap.get('nullifier_hash') as Uint8Array
          });
        })
        .catch((e) => {
          this.logger.error(`Failed to initialize the mixer for withdrawer`, e);
          this.emit('withdraw', e, true);
        });
    } catch (e) {
      this.emit('withdraw', e, true);
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
        this.withdraw(event[name].mixerGroup, event[name].note, event[name].root, event[name].leaves);
        break;
    }
  }
}
