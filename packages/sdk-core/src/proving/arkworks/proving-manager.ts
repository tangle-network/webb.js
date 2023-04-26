// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { ArkworksProvingManagerThread } from '@webb-tools/sdk-core/proving/arkworks/proving-manager-thread.js';

import { ProofInterface, ProvingManagerSetupInput } from '../types.js';
import { workerInputMapper, WorkerProofInterface, workerProofTranslator, WorkerProvingManagerSetupInput } from '../worker-utils.js';

export class ArkworksProvingManager {
  constructor (
    private readonly worker: Worker | null | undefined // Optional WebWorker
  ) {}

  /**
   * Checks the current `ProvingManager` status wither it is proving with a Worker(browser) or directly(Nodejs),
   * accordingly it will run to write private function
   * `ProvingManager.proveWithWorker` for browser,And `ProvingManager.proveWithoutWorker` for Nodejs
   *
   * @param  input - input for the manager
   **/
  public async prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>): Promise<ProofInterface<T>> {
    const worker = this.worker;

    const workerThreadInput = workerInputMapper(protocol, input);

    const workerProof = worker
      ? await ArkworksProvingManager.proveWithWorker([protocol, workerThreadInput], worker)
      : await ArkworksProvingManager.proveWithoutWorker(protocol, workerThreadInput);

    return workerProofTranslator(protocol, workerProof);
  }

  private static proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: WorkerProvingManagerSetupInput<T>): Promise<WorkerProofInterface<T>> {
    // If the worker CTX is direct-call
    const pm = new ArkworksProvingManagerThread('direct-call');

    return pm.prove(protocol, input);
  }

  private static proveWithWorker<T extends NoteProtocol> (
    input: [T, WorkerProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<WorkerProofInterface<T>> {
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
