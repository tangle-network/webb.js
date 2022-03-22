// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ProvingManagerSetupInput } from '@webb-tools/sdk-core/proving/proving-manager-thread';
import { Proof } from '@webb-tools/wasm-utils/web';

export type ProofI = Omit<Proof, 'free'>;

export class ProvingManager {
  constructor (private readonly worker: Worker) {}

  proof (input: ProvingManagerSetupInput): Promise<ProofI> {
    return new Promise<ProofI>((resolve, reject) => {
      try {
        this.worker.addEventListener('message', (e) => {
          const payload = e.data.data as ProofI;

          resolve(payload);
        });
        this.worker.postMessage({
          proof: input
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
