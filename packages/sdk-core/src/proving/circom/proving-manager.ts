// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { CircomProvingManagerThread } from '@webb-tools/sdk-core/proving/circom/proving-manager-thread.js';

import { ProofInterface, ProvingManagerSetupInput } from '../types.js';
import { workerInputMapper, WorkerProofInterface, workerProofTranslator, WorkerProvingManagerSetupInput } from '../worker-utils.js';

// Circom uses snarkjs to generate and verify proofs. It requires a witness calculator.
export class CircomProvingManager {
  constructor (
    private circuitWasm: Uint8Array,
    private treeDepth: number,
    private readonly worker: Worker | null | undefined // Optional WebWorker
  ) {
  }

  /**
   * @param  input - input to prove
   **/
  public async prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>): Promise<ProofInterface<T>> {
    const worker = this.worker;

    const workerThreadInput = workerInputMapper(protocol, input);

    const workerProof = worker
      ? await this.proveWithWorker([protocol, workerThreadInput], worker)
      : await this.proveWithoutWorker(protocol, workerThreadInput);

    return workerProofTranslator(protocol, workerProof);
  }

  private proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: WorkerProvingManagerSetupInput<T>): Promise<WorkerProofInterface<T>> {
    // If the worker CTX is direct-call
    const pm = new CircomProvingManagerThread(this.circuitWasm, this.treeDepth, 'direct-call');

    return pm.prove(protocol, input);
  }

  public setupWorker () {
    return new Promise((resolve, reject) => {
      const worker = this.worker;

      if (worker) {
        worker.postMessage({
          setup: {
            circuitWasm: this.circuitWasm,
            treeDepth: this.treeDepth
          }
        });

        const handler = (event: MessageEvent<any>) => {
          const eventName = event.data.name;

          if (eventName === 'setup') {
            worker.removeEventListener('message', handler);
            resolve(undefined);
          }
        };

        worker.addEventListener('message', handler);
      } else {
        reject(new Error('No worker attached to the proving manager'));
      }
    });
  }

  private async proveWithWorker<T extends NoteProtocol> (
    input: [T, WorkerProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<WorkerProofInterface<T>> {
    await this.setupWorker();

    return new Promise<WorkerProofInterface<T>>((resolve, reject) => {
      try {
        worker.addEventListener('message', (e) => {
          const payload = e.data.data as WorkerProofInterface<T>;

          resolve(payload);
        });
        worker.postMessage({
          proof: input
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
