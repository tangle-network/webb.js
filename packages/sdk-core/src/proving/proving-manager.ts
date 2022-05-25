// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import type { JsNote, JsUtxo, NoteProtocol } from '@webb-tools/wasm-utils';

import { ProvingManagerSetupInput, ProvingManagerWrapper } from '@webb-tools/sdk-core/proving/proving-manager-thread.js';

type VAnchorProof = {
  readonly inputUtxos: Array<JsUtxo>;
  readonly outputNotes: Array<JsNote>;
  readonly proof: string;
  readonly publicInputs: Array<string>;
};
type AnchorProof = {
  readonly nullifierHash: string;
  readonly proof: string;
  readonly root: string;
  readonly roots: Array<string>;
};

type MixerProof = {
  readonly nullifierHash: string;
  readonly proof: string;
  readonly root: string;
};

export type ProofI<T extends NoteProtocol> = T extends 'vanchor'
  ? VAnchorProof
  : T extends 'mixer'
    ? MixerProof
    : AnchorProof;

export class ProvingManager {
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
      return ProvingManager.proveWithWorker([protocol, input], worker);
    }

    return ProvingManager.proveWithoutWorker(protocol, input);
  }

  private static proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    // If the worker CTX is direct-call
    const pm = new ProvingManagerWrapper('direct-call');

    return pm.prove(protocol, input);
  }

  private static proveWithWorker<T extends NoteProtocol> (
    input: [T, ProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<ProofI<T>> {
    return new Promise<ProofI<T>>((resolve, reject) => {
      try {
        worker.addEventListener('message', (e) => {
          const payload = e.data.data as ProofI<T>;

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
