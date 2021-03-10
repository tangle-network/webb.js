import type { Mixer } from '@webb-tools/mixer-client';
import { MixerGroups } from '@webb-tools/mixer-client';
import type { TokenSymbol } from '@webb-tools/sdk-mixer';
import { Note } from '@webb-tools/sdk-mixer';
import { LoggerService } from '@webb-tools/app-util';

type Asset = {
  id: number;
  tokenSymbol: TokenSymbol;
};
export type Events = 'init' | 'generateNote' | 'deposit' | 'createProof' | 'preGenerateBulletproofGens';
export type WasmMessage = Record<Events, unknown>;

export interface WasmWorkerMessageTX extends WasmMessage {
  init: void;
  preGenerateBulletproofGens: {
    bulletproofGens: Uint8Array;
  };
  generateNote: {
    note: string;
  };
  deposit: {
    leaf: Uint8Array;
    note: string;
  };
  createProof: {
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
    bulletproofGens?: Uint8Array;
  };
  preGenerateBulletproofGens: void;
  deposit: {
    note?: string;
    asset?: Asset;
  };
  createProof: {
    mixerGroup: Array<[TokenSymbol, number, number]>;
    leaves: Array<Uint8Array>;
    root: Uint8Array;
    note: string;
    bulletproofGens?: Uint8Array;
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

  public preGenerateBulletproofGens(): void {
    import('@webb-tools/mixer-client')
      .then((wasm) => {
        const opts = new wasm.PoseidonHasherOptions();
        const bulletproofGens = opts.bp_gens;
        this.emit('preGenerateBulletproofGens', { bulletproofGens }, false);
      })
      .catch((e) => {
        this.logger.error(`Failed to initialized the poseidon hasher`, e);
        this.emit('preGenerateBulletproofGens', e, true);
      });
  }

  public init(mixerGroup: Array<[TokenSymbol, number, number]>, bulletproofGens?: Uint8Array): void {
    import('@webb-tools/mixer-client')
      .then((wasm) => {
        const opts = new wasm.PoseidonHasherOptions();
        if (bulletproofGens && bulletproofGens.length !== 0) {
          opts.bp_gens = bulletproofGens;
        }
        const hasher = new wasm.PoseidonHasher(opts);
        const mixerGroups: MixerGroups = mixerGroup.map(([asset, groupId, treeDepth]) => ({
          asset,
          group_id: groupId,
          tree_depth: treeDepth
        }));
        this.logger.debug('Mixer initialized with mixerGroup ', mixerGroups);
        this.mixer = new wasm.Mixer(mixerGroups, hasher);
        this.emit('init', undefined);
      })
      .catch((e) => {
        this.logger.error(`Failed to initialized the mixer`, e);
        this.emit('init', e, true);
      });
  }

  public generateNote(asset: Asset): void {
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

  public deposit(noteSerialized?: string, assetSerialized?: Asset): void {
    if (!this.mixer) {
      this.emit('deposit', 'Mixer is not initialized', true);
      return;
    }
    try {
      if (noteSerialized) {
        const leaf = this.mixer.save_note(noteSerialized);
        return this.emit('deposit', {
          leaf,
          note: noteSerialized
        });
      } else if (assetSerialized) {
        const note = this.mixer.generate_note(assetSerialized.tokenSymbol, assetSerialized.id);
        const leaf = this.mixer.save_note(note);
        return this.emit('deposit', {
          leaf,
          note
        });
      }
    } catch (e) {
      this.emit('deposit', e, true);
    }
  }

  public createProof(
    mixerGroup: Array<[TokenSymbol, number, number]>,
    note: string,
    root: Uint8Array,
    leaves: Array<Uint8Array>,
    bulletproofGens?: Uint8Array
  ): void {
    if (!this.mixer) {
      this.emit('createProof', 'Mixer is not initialized', true);
      return;
    }
    try {
      type ZKProofMap = Map<'comms' | 'nullifier_hash' | 'leaf_index_comms' | 'proof_comms' | 'proof', unknown>;
      const mynote = Note.deserialize(note);
      import('@webb-tools/mixer-client')
        .then((wasm) => {
          this.logger.debug('Created a new Mixer for createProofal..');
          this.logger.trace(`Generating poseidon hash options`);
          const opts = new wasm.PoseidonHasherOptions();
          this.logger.trace(`Generating poseidon hash options`, opts);
          if (bulletproofGens && bulletproofGens.length !== 0) {
            this.logger.trace(`Setting bulletproofGens with length `, bulletproofGens.length);
            opts.bp_gens = bulletproofGens;
          }
          this.logger.trace(`Creating poseidon hasher`);
          const hasher = new wasm.PoseidonHasher(opts);
          this.logger.trace(`Created poseidon hasher`);
          this.logger.trace(`Init new mixer with hasher `, hasher, 'mixerGroup', mixerGroup);
          const mixerGroups: MixerGroups = mixerGroup
            .filter(([asset, groupId, treeDepth]) => asset === mynote.asAsset().tokenSymbol)
            .map(([asset, groupId, treeDepth]) => ({
              asset,
              group_id: groupId,
              tree_depth: treeDepth
            }));
          const mixer = new wasm.Mixer(mixerGroups, hasher);
          this.logger.debug(
            `adding [mynote.tokenSymbol, mynote.id, leaves, root]`,
            mynote.tokenSymbol,
            mynote.id,
            leaves,
            root
          );

          this.logger.trace(`Saving note`);
          const leaf = mixer.save_note(note);
          this.logger.trace(`Saved  note`);
          leaves.push(leaf);
          mixer.add_leaves(mynote.tokenSymbol, mynote.id, leaves, root);
          this.logger.trace(`Added leaves`);

          this.logger.debug(`Got leaf from  saved note`, leaf);
          this.logger.trace(`Generating Zero knowledge proof`);
          this.logger.debug(
            `GZKP args [mynote.tokenSymbol, mynote.id, root, leaf] `,
            mynote.tokenSymbol,
            mynote.id,
            root,
            leaf
          );

          const zkProofMap = mixer.generate_proof(mynote.tokenSymbol, mynote.id, root, leaf) as ZKProofMap;
          this.logger.trace(`Generated zKProof`);
          this.emit('createProof', {
            leafIndexCommitments: zkProofMap.get('leaf_index_comms') as Array<Uint8Array>,
            commitments: zkProofMap.get('comms') as Array<Uint8Array>,
            proofCommitments: zkProofMap.get('proof_comms') as Array<Uint8Array>,
            proof: zkProofMap.get('proof') as Uint8Array,
            nullifierHash: zkProofMap.get('nullifier_hash') as Uint8Array
          });
        })
        .catch((e) => {
          this.logger.error(`Failed to initialize the mixer for createProofer`, e);
          this.emit('createProof', e, true);
        });
    } catch (e) {
      this.emit('createProof', e, true);
    }
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
      case 'init':
        this.init(event[name].mixerGroup, event[name].bulletproofGens);
        break;
      case 'deposit':
        this.deposit(event[name].note, event[name].asset);
        break;
      case 'createProof':
        this.createProof(
          event[name].mixerGroup,
          event[name].note,
          event[name].root,
          event[name].leaves,
          event[name].bulletproofGens
        );
        break;
      case 'preGenerateBulletproofGens':
        this.preGenerateBulletproofGens();
        break;
    }
  }
}
