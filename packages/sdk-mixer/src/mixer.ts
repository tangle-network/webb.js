import { Asset, MixerAssetGroup, Note, TokenSymbol, Withdrawer } from '@webb-tools/sdk-mixer';
import type { Event, WasmWorkerMessageRX } from './wasm.worker';

export class Mixer {
  private constructor(private readonly worker: Worker, private readonly assetGroups: MixerAssetGroup[]) {}

  public destroy() {
    this.worker.terminate();
  }

  public static async init(assetGroups: MixerAssetGroup[]): Promise<Mixer> {
    const tree: Array<[TokenSymbol, number, number]> = assetGroups.map((v) => [v.tokenSymbol, v.gid, v.treeDepth]);
    const worker = new Worker(`./wasm.worker.js`);
    worker.postMessage({
      mixerGroup: tree
    } as WasmWorkerMessageRX['init']);
    const mixer = new Mixer(worker, assetGroups);
    return new Promise((res) => {
      const handler = (event: any) => {
        const data = event.data as Event;
        if (data.name === 'init') {
          res(mixer);
          worker.removeEventListener('message', handler);
        }
      };
      worker.addEventListener('message', handler);
    });
  }

  /**
   * Geneate a new Note without sending any TX.
   *
   * The generated note can be used later to do a deposit.
   **/
  public generateNote(asset: Asset): Note {
    const rawNote = this.inner.generate_note(asset.tokenSymbol, asset.id);
    return Note.deserialize(rawNote);
  }

  /**
   * Prepare the Note and generate a `leaf` to be sent when doing the deposit TX.
   *
   * the `fn` callback should do the deposit operation and return the Transaction `BlockNumber`.
   *
   * This method also could be called by using only the `Asset` and if so this method will generate
   * a new `Note` and prepare it for the deposit TX.
   **/
  public async deposit(noteOrAsset: Note | Asset, fn: (leaf: Uint8Array) => Promise<number>): Promise<Note> {
    type SavedNote = Map<'leaf' | 'asset' | 'id', any>;
    let note: Note;
    let savedNote: SavedNote;

    if (noteOrAsset instanceof Asset) {
      const asset: Asset = noteOrAsset;
      const rawNote = this.inner.generate_note(asset.tokenSymbol, asset.id);
      note = Note.deserialize(rawNote);
      savedNote = this.inner.save_note(rawNote) as SavedNote;
    } else if (noteOrAsset instanceof Note) {
      note = noteOrAsset;
      savedNote = this.inner.save_note(noteOrAsset.serialize()) as SavedNote;
    } else {
      throw new Error('Bad Note or Asset provided');
    }

    const leaf = savedNote.get('leaf') as Uint8Array;
    const blockNumber = await fn(leaf);
    note.blockNumber = blockNumber;
    return note;
  }

  /**
   * Get a new {Withdrawer} that can be used for withdrawing TXs.
   *
   * Note: This will create a new mixer, these `leaves` will not be added to the current Mixer.
   * So you can freely create new {Withdrawer}s at any point in time.
   *
   **/
  public async asWithdrawer(note: Note, root: Uint8Array, leaves: Array<Uint8Array>): Promise<Withdrawer> {
    // create a new mixer instance to be used to avoid `leaves` deplucation.
    const wasm = await import('@webb-tools/mixer-client'); // cached
    const mixer = wasm.Mixer.new(this.assetGroups);
    mixer.add_leaves(note.tokenSymbol, note.id, leaves);
    return new Withdrawer(mixer, root, note);
  }
}
