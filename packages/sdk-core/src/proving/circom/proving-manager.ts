// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { threadProofToMangerProof } from '@webb-tools/sdk-core/proving/thread-proof-to-manger-proof.js';

import { ProvingManagerSetupInput, WorkerProof } from '../types.js';
import { CircomProvingManagerWrapper } from './proving-manager-thread.js';

// Circom uses snarkjs to generate and verify proofs. It requires a witness calculator.
export class CircomProvingManager {
  constructor (
    private circuitWasm: Uint8Array,
    private readonly worker: Worker | null | undefined // Optional WebWorker
  ) {
  }

  /**
   * @param  input - input to prove
   **/
  public async prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    const worker = this.worker;
    const proofData = await (worker
      ? this.proveWithWorker([protocol, input], worker)
      : this.proveWithoutWorker(protocol, input));

    return threadProofToMangerProof(protocol, proofData);
  }

  private proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    // If the worker CTX is direct-call
    const pm = new CircomProvingManagerWrapper(this.circuitWasm, 'direct-call');

    return pm.prove(protocol, input);
  }

  private proveWithWorker<T extends NoteProtocol> (
    input: [T, ProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<WorkerProof<T>> {
    throw new Error('proveWithWorker unimplemented for CircomProvingManager');
  }
}
