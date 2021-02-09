import { Asset, MixerAssetGroup, Note, TokenSymbol, WasmMessage, WasmWorkerMessageTX } from '@webb-tools/sdk-mixer';
import type { Event, WasmWorkerMessageRX } from './wasm-thread';

export class Mixer {
  // @ts-ignore
  private constructor(private readonly worker: Worker, private readonly assetGroups: MixerAssetGroup[]) {}

  public destroy(): void {
    this.worker.terminate();
  }

  private postMessage<T extends keyof WasmMessage>(
    name: T,
    value: WasmWorkerMessageRX[T]
  ): Promise<WasmWorkerMessageTX[T]> {
    this.worker.postMessage({ [name]: value });

    return new Promise((resolve, reject) => {
      const handler = (event: { data: Event<T> }) => {
        const data = event.data;
        if (data.name === name) {
          resolve(data.value);
          this.worker.removeEventListener('message', handler);
        }
      };
      this.worker.addEventListener('message', handler);
    });
  }

  public static async init(worker: Worker, assetGroups: MixerAssetGroup[]): Promise<Mixer> {
    const tree: Array<[TokenSymbol, number, number]> = assetGroups.map((v) => [v.tokenSymbol, v.gid, v.treeDepth]);
    const mixer = new Mixer(worker, assetGroups);
    await mixer.postMessage('init', {
      mixerGroup: tree
    });
    return mixer;
  }

  /**
   * Geneate a new Note without sending any TX.
   *
   * The generated note can be used later to do a deposit.
   **/
  public async generateNote(asset: Asset): Promise<Note> {
    const { note: noteSerialized } = await this.postMessage('generateNote', {
      ...asset
    });
    return Note.deserialize(noteSerialized);
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
    let leaf: Uint8Array;
    let note: Note;
    if (noteOrAsset instanceof Asset) {
      const { note: _note, leaf: _leaf } = await this.postMessage('deposit', {
        asset: { id: noteOrAsset.id, tokenSymbol: noteOrAsset.tokenSymbol }
      });
      leaf = _leaf;
      note = Note.deserialize(_note);
    } else {
      const { note: _note, leaf: _leaf } = await this.postMessage('deposit', {
        note: noteOrAsset.serialize()
      });
      leaf = _leaf;
      note = Note.deserialize(_note);
    }

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
  // public async asWithdrawer(note: Note, root: Uint8Array, leaves: Array<Uint8Array>): Promise<any> {
  //   // create a new mixer instance to be used to avoid `leaves` deplucation.
  //   // const wasm = await import('@webb-tools/mixer-client'); // cached
  //   // const mixer = wasm.Mixer.new(this.assetGroups);
  //   // mixer.add_leaves(note.tokenSymbol, note.id, leaves);
  //   // return new Withdrawer(mixer, root, note);
  //   return {};
  // }
}
