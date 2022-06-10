// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { ProofInterface, ProvingManagerSetupInput } from '../types.js';
import { workerInputMapper, WorkerProofInterface, workerProofTranslator, WorkerProvingManagerSetupInput } from '../worker-utils.js';
import { CircomProvingManagerThread } from './proving-manager-thread.js';

// Circom uses snarkjs to generate and verify proofs. It requires a witness calculator.
export class CircomProvingManager {
  constructor (
    private circuitWasm: Uint8Array,
    private readonly worker: Worker | null | undefined // Optional WebWorker
  ) {}

  /**
   * @param  input - input to prove
   **/
  public async prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>): Promise<ProofInterface<T>> {
    const worker = this.worker;

    const workerThreadInput = workerInputMapper(protocol, input);

    let workerProof: WorkerProofInterface<T>;

    if (worker) {
      workerProof = await this.proveWithWorker([protocol, workerThreadInput], worker);
    } else {
      workerProof = await this.proveWithoutWorker(protocol, workerThreadInput);
    }

    return workerProofTranslator(protocol, workerProof);
  }

  private proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: WorkerProvingManagerSetupInput<T>): Promise<WorkerProofInterface<T>> {
    // If the worker CTX is direct-call
    const pm = new CircomProvingManagerThread(this.circuitWasm, 'direct-call');

    return pm.prove(protocol, input);
  }

  private proveWithWorker<T extends NoteProtocol> (
    input: [T, WorkerProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<WorkerProofInterface<T>> {
    throw new Error('proveWithWorker unimplemented for CircomProvingManager');
  }
}
