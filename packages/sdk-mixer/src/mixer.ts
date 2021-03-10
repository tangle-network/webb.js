import {
  Asset,
  Event,
  MixerAssetGroup,
  Note,
  TokenSymbol,
  WasmMessage,
  WasmWorkerMessageRX,
  WasmWorkerMessageTX
} from '@webb-tools/sdk-mixer';
import { LoggerService } from '@webb-tools/app-util';
// import { MerkleTree, buildMerkleTree as build } from '@webb-tools/sdk-merkle';
import { ZKProof } from './zkproof';

export class Mixer {
  private readonly logger = LoggerService.new('Mixer');
  private destroyed = false;
  private constructor(
    private readonly worker: Worker,
    private readonly assetGroups: MixerAssetGroup[],
    private readonly bulletproofGens?: Uint8Array
  ) {}

  // private mt: MerkleTree;

  public destroy(): void {
    this.logger.info(`Worker destroyed`);
    this.worker.terminate();
    this.destroyed = true;
  }

  private async destroyGuard(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Mixer is destroyed');
    }
  }

  private postMessage<T extends keyof WasmMessage>(
    name: T,
    value: WasmWorkerMessageRX[T]
  ): Promise<WasmWorkerMessageTX[T]> {
    this.logger.debug(`Posting event ${name}`, value);
    this.worker.postMessage({ [name]: value });

    return new Promise((resolve, reject) => {
      const handler = ({ data: result }: { data: Event<T> }) => {
        if (result.name === name && !result.error) {
          this.logger.debug(`Data for event ${name} is`, result.value);
          this.worker.removeEventListener('message', handler);
          resolve(result.value);
        } else if (result.name === name && result.error) {
          this.logger.error(`Got Error for event ${name} with`, result.value);
          this.worker.removeEventListener('message', handler);
          reject(result.value);
        }
      };
      this.worker.addEventListener('message', handler);
    });
  }

  public static async init(
    worker: Worker,
    assetGroups: MixerAssetGroup[],
    bulletproofGens?: Uint8Array
  ): Promise<Mixer> {
    const tree: Array<[TokenSymbol, number, number]> = assetGroups.map((v) => [v.tokenSymbol, v.gid, v.treeDepth]);
    const mixer = new Mixer(worker, assetGroups, bulletproofGens);
    mixer.logger.debug(`Mixer initialized with assetGroups`, assetGroups);
    await mixer.postMessage('init', {
      mixerGroup: tree,
      bulletproofGens
    });
    return mixer;
  }

  /**
   * Calculates the `BulletproofsGens` beforehand.
   * so it can be easily cached and reused whenever you need the mixer.
   *
   * */
  public static async preGenerateBulletproofGens(worker: Worker): Promise<Uint8Array> {
    const mixer = new Mixer(worker, []); // just to get the postMessage.
    const { bulletproofGens } = await mixer.postMessage('preGenerateBulletproofGens', undefined);
    return bulletproofGens;
  }

  /**
   * Geneate a new Note without sending any TX.
   *
   * The generated note can be used later to do a deposit.
   **/
  public async generateNote(asset: Asset): Promise<Note> {
    await this.destroyGuard();
    const { note: noteSerialized } = await this.postMessage('generateNote', {
      ...asset
    });
    return Note.deserialize(noteSerialized);
  }

  /**
   * Saves the note into the MerkleTree and retuns the leaf (NoteCommitment)
   * */
  public async saveNote(note: Note): Promise<Uint8Array> {
    await this.destroyGuard();
    const { leaf } = await this.postMessage('generateNoteAndLeaf', {
      note: note.serialize()
    });
    return leaf;
  }

  /**
   * Prepare the Note and generate a `leaf` to be sent when doing the deposit TX.
   *
   * the `fn` callback should do the deposit operation and return the Transaction `BlockNumber`.
   *
   * This method also could be called by using only the `Asset` and if so this method will generate
   * a new `Note` and prepare it for the deposit TX.
   **/
  public async generateNoteAndLeaf(noteOrAsset: Note | Asset): Promise<[Note, Uint8Array]> {
    let leaf: Uint8Array;
    let note: Note;
    await this.destroyGuard();

    if (noteOrAsset instanceof Asset) {
      const { note: _note, leaf: _leaf } = await this.postMessage('generateNoteAndLeaf', {
        asset: { id: noteOrAsset.id, tokenSymbol: noteOrAsset.tokenSymbol }
      });
      leaf = _leaf;
      note = Note.deserialize(_note);
    } else {
      const { note: _note, leaf: _leaf } = await this.postMessage('generateNoteAndLeaf', {
        note: noteOrAsset.serialize()
      });
      leaf = _leaf;
      note = Note.deserialize(_note);
    }

    return [note, leaf];
  }

  /**
   * Withdraw a note with the specified root and leaves.
   * generate a zkproof and then do the withdraw operation using this ZKProof.
   * the `fn` callback should do the withdraw operation.
   *
   * Note: This will create a new mixer under the hood, these `leaves` will not be added to the current Mixer.
   * So you can freely call this method at any point in time.
   *
   **/
  public async withdraw(note: Note, root: Uint8Array, leaves: Array<Uint8Array>): Promise<ZKProof> {
    await this.destroyGuard();
    const mixerGroup: Array<[TokenSymbol, number, number]> = this.assetGroups.map((v) => [
      v.tokenSymbol,
      v.gid,
      v.treeDepth
    ]);
    const { leafIndexCommitments, commitments, proofCommitments, proof, nullifierHash } = await this.postMessage(
      'createProof',
      {
        note: note.serialize(),
        mixerGroup,
        leaves,
        root,
        bulletproofGens: this.bulletproofGens
      }
    );

    return new ZKProof(leafIndexCommitments, commitments, proofCommitments, nullifierHash, proof);
  }
}
