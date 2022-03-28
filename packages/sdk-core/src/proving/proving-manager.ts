// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ProvingManagerSetupInput, ProvingManagerWrapper } from '@webb-tools/sdk-core/proving/proving-manager-thread';
import { Proof } from '@webb-tools/wasm-utils';

export type ProofI = Omit<Proof, 'free'>;

export class ProvingManager {
  constructor (private readonly worker: Worker | null | undefined) {}

  public prove (input: ProvingManagerSetupInput) {
    const worker = this.worker;

    if (worker) {
      return ProvingManager.proveWithWorker(input, worker);
    }

    return ProvingManager.proofWithoutWorker(input);
  }

  private static proofWithoutWorker (input: ProvingManagerSetupInput) {
    const pm = new ProvingManagerWrapper('direct-call');

    return pm.proof(input);
  }

  private static proveWithWorker (input: ProvingManagerSetupInput, worker: Worker): Promise<ProofI> {
    return new Promise<ProofI>((resolve, reject) => {
      try {
        worker.addEventListener('message', (e) => {
          const payload = e.data.data as ProofI;

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
