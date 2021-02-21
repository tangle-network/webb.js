import { LoggerService } from '@webb-tools/app-util';
import { Event, WasmMessage, WasmWorkerMessageRX, WasmWorkerMessageTX } from '@webb-tools/sdk-merkle';

export default class Tree {
  private readonly logger = LoggerService.new('Tree');
  private destroyed = false;

  private constructor(private readonly worker: Worker) {}

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

  /**
   * Hash two elements using the poseidon hash functions
   **/
  public async poseidon(left: Uint8Array, right: Uint8Array): Promise<any> {
    await this.destroyGuard();
    const { hash } = await this.postMessage('poseidon', {
      left,
      right
    });
    return hash;
  }
}
