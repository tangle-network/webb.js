// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

// This file hosts types that are only meant for internal use of sdk-core.
//
// The types are used for Worker contexts since it is difficult to
// pass classes between a worker and main thread.
// The string inputs are meant to be the outputs of serialized classes.
//
// The 'workerInputMapper' class contains logic to translate inputs from users of proving-managers
// to the inputs expected by the proving-manager-thread (worker) class.
//
// The 'workerProofTranslator' class contains logic to translate outputs of worker proofs
// to the outputs expected by users of the proving-managers.

import type { Backend, Leaves, NoteProtocol } from '@webb-tools/wasm-utils';

import { Utxo } from '@webb-tools/sdk-core/index.js';

import { CircomUtxo } from '../solidity-utils/index.js';
import { MixerPMSetupInput, MixerProof, ProofInterface, ProvingManagerSetupInput, VAnchorPMSetupInput } from './types.js';

export type WorkerProvingManagerSetupInput<T extends NoteProtocol> = WorkerProvingManagerPayload[T];

export interface WorkerProvingManagerPayload extends Record<NoteProtocol, any> {
  mixer: MixerPMSetupInput;
  vanchor: WorkerVAnchorPMSetupInput;
}

export type WorkerVAnchorPMSetupInput = {
  inputNotes: string[];
  leavesMap: Record<string, Leaves>;
  indices: number[];
  roots: Leaves;
  chainId: string;
  output: [string, string];
  encryptedCommitments: [Uint8Array, Uint8Array],
  publicAmount: string;
  provingKey: Uint8Array;
  relayer: Uint8Array;
  recipient: Uint8Array;
  extAmount: string;
  fee: string;
  refund: string;
  token: Uint8Array;
};

export type WorkerVAnchorProof = {
  readonly backend: Backend;
  readonly inputUtxos: Array<string>;
  readonly outputUtxos: Array<string>;
  readonly proof: string;
  readonly publicInputs: Array<string>;
  readonly publicAmount: Uint8Array;
  readonly extDataHash: Uint8Array;
}

export type WorkerProofInterface<T extends NoteProtocol> = WorkerProofPayload[T]

export interface WorkerProofPayload extends Record<NoteProtocol, any> {
  mixer: MixerProof,
  VAnchor: WorkerVAnchorProof
}

export async function workerProofTranslator<T extends NoteProtocol> (
  protocol: T,
  proofData: WorkerProofInterface<T>
): Promise<ProofInterface<T>> {
  switch (protocol) {
    case 'vanchor': {
      const sourceVAnchorProof = {
        ...proofData
      } as WorkerVAnchorProof;

      const isCircom = sourceVAnchorProof.backend === 'Circom';

      const outputUtxos = isCircom
        ? await Promise.all(sourceVAnchorProof.outputUtxos.map((note) => CircomUtxo.deserialize(note)))
        : await Promise.all(sourceVAnchorProof.outputUtxos.map((note) => Utxo.deserialize(note)));

      const inputUtxos = isCircom
        ? await Promise.all(sourceVAnchorProof.inputUtxos.map((utxo) => CircomUtxo.deserialize(utxo)))
        : await Promise.all(sourceVAnchorProof.inputUtxos.map((utxo) => Utxo.deserialize(utxo)));

      return {
        extDataHash: sourceVAnchorProof.extDataHash,
        inputUtxos,
        outputUtxos,
        proof: sourceVAnchorProof.proof,
        publicAmount: sourceVAnchorProof.publicAmount,
        publicInputs: sourceVAnchorProof.publicInputs
      } as any;
    }

    default:
      return proofData as any;
  }
}

export function workerInputMapper<T extends NoteProtocol> (
  protocol: T,
  setupData: ProvingManagerSetupInput<T>
): WorkerProvingManagerSetupInput<T> {
  switch (protocol) {
    case 'vanchor': {
      const sourceSetupInput = {
        ...setupData
      } as VAnchorPMSetupInput;

      const inputUtxos = sourceSetupInput.inputUtxos.map((utxo) => utxo.serialize());
      const outputUtxos = sourceSetupInput.output.map((utxo) => utxo.serialize());

      return {
        chainId: sourceSetupInput.chainId,
        encryptedCommitments: sourceSetupInput.encryptedCommitments,
        extAmount: sourceSetupInput.extAmount,
        fee: sourceSetupInput.fee,
        indices: sourceSetupInput.indices,
        inputUtxos,
        leavesMap: sourceSetupInput.leavesMap,
        output: outputUtxos,
        provingKey: sourceSetupInput.provingKey,
        publicAmount: sourceSetupInput.publicAmount,
        recipient: sourceSetupInput.recipient,
        refund: sourceSetupInput.refund,
        relayer: sourceSetupInput.relayer,
        roots: sourceSetupInput.roots,
        token: sourceSetupInput.token
      } as any;
    }

    default:
      return setupData as any;
  }
}
