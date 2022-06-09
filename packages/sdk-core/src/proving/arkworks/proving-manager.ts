// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { ArkworksProvingManagerThread } from '@webb-tools/sdk-core/proving/arkworks/proving-manager-thread.js';

import { ProofInterface, ProvingManagerSetupInput } from '../types';

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
  public prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    const worker = this.worker;

    if (worker) {
      return ArkworksProvingManager.proveWithWorker([protocol, input], worker);
    }

    return ArkworksProvingManager.proveWithoutWorker(protocol, input);
  }

  private static proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    // If the worker CTX is direct-call
    const pm = new ArkworksProvingManagerThread('direct-call');

    return pm.prove(protocol, input);
  }

  private static proveWithWorker<T extends NoteProtocol> (
    input: [T, ProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<ProofInterface<T>> {
    return new Promise<ProofInterface<T>>((resolve, reject) => {
      try {
        worker.addEventListener('message', (e) => {
          const payload = e.data.data as ProofInterface<T>;

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
