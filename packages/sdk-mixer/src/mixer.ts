export {};

/*
import { Asset, Event, Note, WasmMessage, WasmWorkerMessageRX, WasmWorkerMessageTX } from '@webb-tools/sdk-mixer';
import { LoggerService, EventBus } from '@webb-tools/app-util';

type MixerEventMap = {
  restart: undefined;
};

export class Mixer extends EventBus<MixerEventMap> {
  private readonly logger = LoggerService.new('Mixer');
  private destroyed = false;

  private constructor(private worker: Worker, private bulletproofGens?: Uint8Array) {
    super();
  }

  public destroy(): void {
    this.logger.info(`Worker destroyed`);
    // terminate the worker
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
      let off: (() => void) | null | void = null;
      const handler = ({ data: result }: { data: Event<T> }) => {
        // if this is triggered that means the job is done and most likely this promise is resolved
        if (off) {
          off();
        }
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
      // this will be triggered if the worker rasid the event restart so we can  reject the promises
      off = this.on('restart', () => {
        reject(new Error('Restarted'));
        // if this is called that means the worker has events (work)that aren't resolved
        this.worker.removeEventListener('message', handler);
      });
      this.worker.addEventListener('message', handler);
    });
  }

  public static async init(worker: Worker, bulletproofGens?: Uint8Array): Promise<Mixer> {
    const mixer = new Mixer(worker, bulletproofGens);
    if (bulletproofGens) {
      await mixer.postMessage('setBulletProofGens', {
        bulletProofGens: bulletproofGens
      });
    } else {
      const be = await mixer.postMessage('preGenerateBulletproofGens', undefined);
      mixer.bulletproofGens = be.bulletproofGens;
    }

    return mixer;
  }

  /!*
   * Restart the Mixer wont create a new call but will kill the underlying `WebWorker`
   * Reject all tasks
   *
   * *!/
  async restart(worker: Worker): Promise<void> {
    this.logger.info(`Restarting`);
    this.emit('restart', undefined);
    this.worker.terminate();
    this.worker = worker;
    if (this.bulletproofGens) {
      await this.postMessage('setBulletProofGens', {
        bulletProofGens: this.bulletproofGens
      });
    }
  }

  /!**
   * Calculates the `BulletproofsGens` beforehand.
   * so it can be easily cached and reused whenever you need the mixer.
   *
   * *!/
  public static async preGenerateBulletproofGens(worker: Worker): Promise<Uint8Array> {
    const mixer = new Mixer(worker); // just to get the postMessage.
    const { bulletproofGens } = await mixer.postMessage('preGenerateBulletproofGens', undefined);
    return bulletproofGens;
  }

  /!**
   * Geneate a new Note without sending any TX.
   *
   * The generated note can be used later to do a deposit.
   **!/
  public async generateNote(asset: Asset): Promise<Note> {
    await this.destroyGuard();
    const { note: noteSerialized } = await this.postMessage('generateNote', {
      ...asset
    });
    return Note.deserialize(noteSerialized);
  }

  /!**
   * Prepare the Note and generate a `leaf` to be sent when doing the deposit TX.
   *
   * the `fn` callback should do the deposit operation and return the Transaction `BlockNumber`.
   *
   * This method also could be called by using only the `Asset` and if so this method will generate
   * a new `Note` and prepare it for the deposit TX.
   **!/
  public async generateNoteAndLeaf(asset: Asset): Promise<[Note, Uint8Array]> {
    await this.destroyGuard();
    const { note, leaf } = await this.postMessage('generateNote', {
      id: asset.id,
      tokenSymbol: asset.tokenSymbol
    });
    return [Note.deserialize(note), leaf];
  }
}
*/
