import { EventBus, LoggerService } from '@webb-tools/app-util';
import { Rx, Tx } from '@webb-tools/sdk-mixer/wasm-thread';
import { TX as WorkerTx } from '@webb-tools/app-util/shared/worker-with-events.class';

type MixerEventMap = {
  restart: undefined;
};

export class Mixer extends EventBus<MixerEventMap> {
  private readonly logger = LoggerService.new('Mixer');
  private destroyed = false;

  private constructor(private worker: Worker) {
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

  private postMessage<T extends keyof Rx>(name: T, value: Rx[T]): Promise<Tx[T]> {
    this.logger.debug(`Posting event ${name}`, value);
    this.worker.postMessage({ [name]: value });

    return new Promise((resolve, reject) => {
      let off: (() => void) | null | void = null;
      const handler = ({ data: result }: { data: WorkerTx<Tx> }) => {
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

  public static async init(worker: Worker): Promise<Mixer> {
    const mixer = new Mixer(worker);
    return mixer;
  }

  /*
   * Restart the Mixer wont create a new call but will kill the underlying `WebWorker`
   * Reject all tasks
   *
   * */
  async restart(worker: Worker): Promise<void> {
    this.logger.info(`Restarting`);
    this.emit('restart', undefined);
    this.worker.terminate();
    this.worker = worker;
  }

  async generateZKP(data: Rx['generateZKP']) {
    await this.destroyGuard();
    return await this.postMessage('generateZKP', data);
  }
}
