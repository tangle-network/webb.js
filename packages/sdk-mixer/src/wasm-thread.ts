import type { TokenSymbol } from '@webb-tools/sdk-mixer';
import { LoggerService } from '@webb-tools/app-util';
import type { PoseidonHasher } from '@webb-tools/wasm-utils';

type Asset = {
  id: number;
  tokenSymbol: TokenSymbol;
};
export type Events = 'generateNote' | 'setBulletProofGens' | 'preGenerateBulletproofGens';
export type WasmMessage = Record<Events, unknown>;

export interface WasmWorkerMessageTX extends WasmMessage {
  setBulletProofGens: void;
  preGenerateBulletproofGens: {
    bulletproofGens: Uint8Array;
  };
  generateNote: {
    note: string;
    leaf: Uint8Array;
  };
}

export interface WasmWorkerMessageRX extends WasmMessage {
  generateNote: Asset;
  setBulletProofGens: {
    bulletProofGens: Uint8Array;
  };
  preGenerateBulletproofGens: void;
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
  private logger = LoggerService.new('WasmMixer');
  private _hasher: PoseidonHasher | null = null;

  constructor() {
    self.addEventListener('message', (event) => {
      this.on((event.data as unknown) as WasmWorkerMessageRX);
    });
  }

  /**
   *  preGenerateBulletproofGens
   *  @description generates Bulletproof should be cached to faster future init
   * */
  public async preGenerateBulletproofGens(): Promise<void> {
    try {
      const wasm = await WasmMixer.wasm;
      const opts = new wasm.PoseidonHasherOptions();
      const bulletproofGens = opts.bp_gens;
      this._hasher = new wasm.PoseidonHasher(opts);
      this.emit('preGenerateBulletproofGens', { bulletproofGens }, false);
    } catch (e) {
      this.logger.error(`Failed to initialized the poseidon hasher`, e);
      this.emit('preGenerateBulletproofGens', e, true);
    }
  }

  /**
   *  setBulletProofGens
   *  @description Setts the PoseidonHasher on the wasm mixer for future usage
   *  this should be called one time
   * */
  public async setBulletProofGens(bulletProofGens: Uint8Array): Promise<void> {
    const wasm = await WasmMixer.wasm;
    const opts = new wasm.PoseidonHasherOptions();
    opts.bp_gens = bulletProofGens;
    this._hasher = new wasm.PoseidonHasher(opts);
    this.emit('setBulletProofGens', undefined);
  }

  private get hasher() {
    if (!this._hasher) {
      throw new Error('Not PoseidonHasher present, please call `setBulletProofGens` ');
    }
    return this._hasher;
  }

  /**
   *  generateNote
   *  @description Generates a note from , this will create two random numbers R wish is the secret and Nullifer both are random
   *  @param {Asset}
   *  this should be called one time
   * */
  public async generateNote(asset: Asset): Promise<void> {
    try {
      const wasm = await WasmMixer.wasm;
      const noteGenerator = new wasm.NoteGenerator(this.hasher);
      const note = noteGenerator.generate(asset.tokenSymbol, asset.id);
      const leaf = noteGenerator.leaf_of(note);
      this.emit('generateNote', {
        note: note.serialize(),
        leaf
      });
    } catch (e) {
      this.emit('generateNote', e, true);
    }
  }

  private static get wasm() {
    return import('@webb-tools/wasm-utils');
  }

  protected emit<T extends keyof WasmWorkerMessageTX, V extends WasmWorkerMessageTX[T] | string>(
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

  protected on(event: WasmWorkerMessageRX): void {
    const name = Object.keys(event)[0] as keyof WasmWorkerMessageRX;
    this.logger.trace(`Got message  ${name} `, event);
    switch (name) {
      case 'generateNote':
        this.generateNote(event[name]);
        break;
      case 'setBulletProofGens':
        this.setBulletProofGens(event[name].bulletProofGens);
        break;
      case 'preGenerateBulletproofGens':
        this.preGenerateBulletproofGens();
        break;
    }
  }
}
