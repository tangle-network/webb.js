// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { ProofInterface, ProvingManagerSetupInput } from '../types.js';
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
  public prove<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    const worker = this.worker;

    if (worker) {
      return this.proveWithWorker([protocol, input], worker);
    }

    return this.proveWithoutWorker(protocol, input);
  }

  private proveWithoutWorker<T extends NoteProtocol> (protocol: T, input: ProvingManagerSetupInput<T>) {
    // If the worker CTX is direct-call
    const pm = new CircomProvingManagerThread(this.circuitWasm, 'direct-call');

    return pm.prove(protocol, input);
  }

  private proveWithWorker<T extends NoteProtocol> (
    input: [T, ProvingManagerSetupInput<T>],
    worker: Worker
  ): Promise<ProofInterface<T>> {
    throw new Error('proveWithWorker unimplemented for CircomProvingManager');
  }
}
