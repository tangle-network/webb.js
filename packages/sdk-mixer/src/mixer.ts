import { Asset, MixerAssetGroup, Note, TokenSymbol, Withdrawer } from '@webb-tools/sdk-mixer';
import type { Event, WasmWorkerMessageRX } from './wasm.worker';

export class Mixer {
  private constructor(private readonly worker: Worker, private readonly assetGroups: MixerAssetGroup[]) {}

  public destroy(): void {
    this.worker.terminate();
  }

  public static async init(assetGroups: MixerAssetGroup[]): Promise<Mixer> {
    const tree: Array<[TokenSymbol, number, number]> = assetGroups.map((v) => [v.tokenSymbol, v.gid, v.treeDepth]);
    const worker = new Worker('@webb-tools/sdk-mixer/wasm.worker');
    worker.postMessage({
      mixerGroup: tree
    } as WasmWorkerMessageRX['init']);
    const mixer = new Mixer(worker, assetGroups);
    // eslint-disable-next-line promise/param-names
    return new Promise((resolve, reject) => {
      const handler = (event: { data: Event }) => {
        const data = event.data;
        if (data.name === 'init') {
          resolve(mixer);
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
  public async generateNote(asset: Asset): Promise<Note> {
    this.worker.postMessage({
      ...asset
    } as WasmWorkerMessageRX['generateNote']);
    return new Promise((resolve, reject) => {
      const handler = (event: any) => {
        const data = event.data as Event<'generatedNote'>;
        if (data.name === 'generatedNote') {
          resolve(Note.deserialize(data.value.note));
          this.worker.removeEventListener('message', handler);
        }
      };
      this.worker.addEventListener('message', handler);
    });
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
    const [leaf, noteSerialized] = await new Promise<[Uint8Array, string]>((resolve, reject) => {
      const handler = (event: any) => {
        const data = event.data as Event<'deposit'>;
        if (data.name === 'deposit') {
          resolve([data.value.leaf, data.value.note]);
          this.worker.removeEventListener('message', handler);
        }
      };
      this.worker.addEventListener('message', handler);

      if (noteOrAsset instanceof Asset) {
        this.worker.postMessage({
          asset: noteOrAsset,
          note: undefined
        } as WasmWorkerMessageRX['deposit']);
      } else {
        this.worker.postMessage({
          asset: undefined,
          note: noteOrAsset.serialize()
        } as WasmWorkerMessageRX['deposit']);
      }
    });

    const blockNumber = await fn(leaf);
    const note = Note.deserialize(noteSerialized);
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
