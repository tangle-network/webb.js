import { LoggerService, EventBus } from '@webb-tools/app-util';
import {
  CreateWithdrawZKProofArgs,
  Event,
  WasmMessage,
  WasmWorkerMessageRX,
  WasmWorkerMessageTX
} from '@webb-tools/sdk-merkle';

type MerkleTreeEvents = {
  restart: void;
};

export default class MerkleTree extends EventBus<MerkleTreeEvents> {
  private readonly logger = LoggerService.new('MerkleTree');
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

  public static async create(worker: Worker, depth: number, bulletproofGens?: Uint8Array): Promise<MerkleTree> {
    const mt = new MerkleTree(worker, bulletproofGens);
    if (bulletproofGens) {
      await mt.postMessage('setBulletProofGens', {
        bulletProofGens: bulletproofGens
      });
    } else {
      const be = await mt.postMessage('preGenerateBulletproofGens', undefined);
      mt.bulletproofGens = be.bulletproofGens;
    }
    await mt.postMessage('createMerkleTree', { depth });

    return mt;
  }

  /*
   * Restart the MerkleTree wont create a new call but will kill the underlying `WebWorker`
   * Reject all tasks
   *
   * */
  public async restart(worker: Worker): Promise<void> {
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

  /**
   * Calculates the `BulletproofsGens` beforehand.
   * so it can be easily cached and reused whenever you need the MerkleTree.
   * */
  public static async preGenerateBulletproofGens(worker: Worker): Promise<Uint8Array> {
    const mt = new MerkleTree(worker); // just to get the postMessage.
    const { bulletproofGens } = await mt.postMessage('preGenerateBulletproofGens', undefined);
    return bulletproofGens;
  }

  public async root(): Promise<Uint8Array> {
    await this.destroyGuard();
    return this.postMessage('root', undefined);
  }

  public async addLeaf(index: bigint, leaf: Uint8Array): Promise<void> {
    await this.destroyGuard();
    this.postMessage('addLeaf', { index, leaf });
  }

  public async addLeaves(leaves: Uint8Array[], targetRoot?: Uint8Array): Promise<void> {
    await this.destroyGuard();
    this.postMessage('addLeaves', { leaves, targetRoot });
  }

  public async generateZKProof(createWithdrawZKProofArgs: CreateWithdrawZKProofArgs): Promise<ZKProof> {
    await this.destroyGuard();
    const { leafIndexCommitments, commitments, proofCommitments, proof, nullifierHash } = await this.postMessage(
      'createProof',
      createWithdrawZKProofArgs
    );

    return { leafIndexCommitments, commitments, proofCommitments, nullifierHash, proof };
  }
}

export interface ZKProof {
  readonly leafIndexCommitments: Array<Uint8Array>;
  readonly commitments: Array<Uint8Array>;
  readonly proofCommitments: Array<Uint8Array>;
  readonly nullifierHash: Uint8Array;
  readonly proof: Uint8Array;
}
