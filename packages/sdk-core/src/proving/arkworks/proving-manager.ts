// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { ArkworksProvingManagerWrapper } from '@webb-tools/sdk-core/proving/arkworks/proving-manager-thread.js';
import { threadProofToMangerProof } from '@webb-tools/sdk-core/proving/thread-proof-to-manger-proof.js';

import { ProvingManagerProof, ProvingManagerSetupInput, WorkerProof } from '../types';

export class ArkworksProvingManager {
  constructor (
    private readonly worker: Worker | null | undefined // Optional WebWorker
  ) {
  }

  /**
   * Checks the current `ProvingManager` status wither it is proving with a Worker(browser) or directly(Nodejs),
   * accordingly it will run to write private function
   * `ProvingManager.proveWithWorker` for browser,And `ProvingManager.proveWithoutWorker` for Nodejs
   *
   * @param  input - input for the manager
   **/
  public async prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>): Promise<ProvingManagerProof<T>> {
    const worker = this.worker;
    const proofData = await (worker
      ? ArkworksProvingManager.proveWithWorker([protocol, input], worker)
      : ArkworksProvingManager.proveWithoutWorker(protocol, input));

    return threadProofToMangerProof(protocol, proofData);
  }

  private static proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    // If the worker CTX is direct-call
    const pm = new ArkworksProvingManagerWrapper('direct-call');

    return pm.prove(protocol, input);
  }

  private static proveWithWorker<T extends NoteProtocol> (
    input: [T, ProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<WorkerProof<T>> {
    return new Promise<WorkerProof<T>>((resolve, reject) => {
      try {
        worker.addEventListener('message', (e) => {
          const payload = e.data.data as WorkerProof<T>;

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
