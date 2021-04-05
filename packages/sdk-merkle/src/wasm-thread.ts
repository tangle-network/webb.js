import { LoggerService } from '@webb-tools/app-util';
import type { PoseidonHasher, MerkleTree } from '@webb-tools/wasm-utils';

export type Events =
  | 'createMerkleTree'
  | 'setBulletProofGens'
  | 'createProof'
  | 'preGenerateBulletproofGens'
  | 'addLeafAtIndex'
  | 'addLeaves'
  | 'root';
export type WasmMessage = Record<Events, unknown>;

export interface WasmWorkerMessageTX extends WasmMessage {
  setBulletProofGens: void;
  preGenerateBulletproofGens: {
    bulletproofGens: Uint8Array;
  };
  createMerkleTree: void;
  addLeafAtIndex: void;
  addLeaves: void;
  root: Uint8Array;
  createProof: {
    leafIndexCommitments: Array<Uint8Array>;
    commitments: Array<Uint8Array>;
    proofCommitments: Array<Uint8Array>;
    nullifierHash: Uint8Array;
    proof: Uint8Array;
  };
}

export interface WasmWorkerMessageRX extends WasmMessage {
  setBulletProofGens: {
    bulletProofGens: Uint8Array;
  };
  preGenerateBulletproofGens: void;
  createMerkleTree: {
    depth: number;
  };
  addLeafAtIndex: {
    leaf: Uint8Array;
    index: bigint;
  };
  addLeaves: {
    leaves: Array<Uint8Array>;
    targetRoot?: Uint8Array;
  };
  root: undefined;
  createProof: {
    root: Uint8Array;
    note: string;
    relayer: Uint8Array;
    recipient: Uint8Array;
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

export type CreateWithdrawZKProofArgs = {
  /// Deposit note string
  note: string;
  /// Deposit note root
  root: Uint8Array;
  relayer: Uint8Array;
  recipient: Uint8Array;
};

export class WasmMerkle {
  private logger = LoggerService.new('WasmMerkle');
  private _hasher: PoseidonHasher | null = null;
  private _mt: MerkleTree | null = null;

  constructor() {
    self.addEventListener('message', (event) => {
      this.on((event.data as unknown) as WasmWorkerMessageRX);
    });
  }

  private get hasher() {
    if (!this._hasher) {
      throw new Error('Not PoseidonHasher present, please call `setBulletProofGens` ');
    }
    return this._hasher;
  }

  private get merkleTree() {
    if (!this._mt) {
      throw new Error('Not MerkleTree present, please call `createMerkleTree` ');
    }
    return this._mt;
  }

  private static get wasm() {
    return import('@webb-tools/wasm-utils');
  }

  /**
   *  preGenerateBulletproofGens
   *  @description generates Bulletproof should be cached to faster future init
   * */
  public async preGenerateBulletproofGens(): Promise<void> {
    try {
      const wasm = await WasmMerkle.wasm;
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
    const wasm = await WasmMerkle.wasm;
    const opts = new wasm.PoseidonHasherOptions();
    opts.bp_gens = bulletProofGens;
    this._hasher = new wasm.PoseidonHasher(opts);
    this.emit('setBulletProofGens', undefined);
  }

  /**
   * createMerkleTree
   * @description Create a MerkleTree, this should be called once after calling `setBulletProofGens`.
   * @param {number} depth - Tree depth (usually to 32).
   * */
  public async createMerkleTree(depth: number): Promise<void> {
    try {
      const hasher = this.hasher;
      const wasm = await WasmMerkle.wasm;
      this._mt = new wasm.MerkleTree(depth, hasher);
      this.emit('createMerkleTree', undefined);
    } catch (e) {
      this.emit('createMerkleTree', e, true);
    }
  }

  /**
   *  addLeaf
   *  @description Adds a new leaf to the merkle tree add index.
   *  @param {Uint8Array} leaf - the new leaf to be added.
   *  @param {bigint} index - the index of the new leaf.
   * */
  public async addLeafAtIndex(leaf: Uint8Array, index: bigint): Promise<void> {
    try {
      this.merkleTree.add_leaf_at_index(leaf, index);
      this.emit('addLeafAtIndex', undefined);
    } catch (e) {
      this.emit('addLeafAtIndex', e, true);
    }
  }

  public async addLeaves(leaves: Uint8Array[], targetRoot?: Uint8Array): Promise<void> {
    try {
      this.merkleTree.add_leaves(leaves, targetRoot);
      this.emit('addLeaves', undefined);
    } catch (e) {
      this.emit('addLeaves', e, true);
    }
  }

  public async root(): Promise<void> {
    try {
      const root = this.merkleTree.root();
      this.emit('root', root);
    } catch (e) {
      this.emit('root', e, true);
    }
  }

  /**
   *  createProof
   *  @description Generates a note from , this will create two random numbers R wish is the secret and Nullifer both are random
   *  @param {string} note - Note serialized
   *  @Param {Uint8Array}  root - Merkle root for verifying against
   * */
  public async createProof({ note, recipient, relayer, root }: CreateWithdrawZKProofArgs): Promise<void> {
    try {
      const wasm = await WasmMerkle.wasm;
      const depositNote = wasm.Note.deserialize(note);
      const zkProof = this.merkleTree.create_zk_proof(root, recipient, relayer, depositNote);
      this.emit('createProof', {
        commitments: zkProof.comms,
        leafIndexCommitments: zkProof.leaf_index_comms,
        proof: zkProof.proof,
        nullifierHash: zkProof.nullifier_hash,
        proofCommitments: zkProof.proof_comms
      });
    } catch (e) {
      this.logger.error(`Failed to create proof`, e);
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
      case 'setBulletProofGens':
        this.setBulletProofGens(event[name].bulletProofGens);
        break;
      case 'createMerkleTree':
        this.createMerkleTree(event[name].depth);
        break;
      case 'root':
        this.root();
        break;
      case 'addLeafAtIndex':
        this.addLeafAtIndex(event[name].leaf, event[name].index);
        break;
      case 'addLeaves':
        this.addLeaves(event[name].leaves, event[name].targetRoot);
        break;
      case 'createProof':
        this.createProof(event[name]);
        break;
      case 'preGenerateBulletproofGens':
        this.preGenerateBulletproofGens();
        break;
    }
  }
}
