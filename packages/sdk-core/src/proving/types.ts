// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// This file is meant to host types that are used for proving
// It exposes the typed inputs and outputs for sdk-core for external use.

import type { Leaves, NoteProtocol } from '@webb-tools/wasm-utils';

import { Note } from '../note.js';
import { Utxo } from '../utxo.js';

export type ProvingManagerSetupInput<T extends NoteProtocol> = ProvingManagerPayload[T];

export type PMEvents<T extends NoteProtocol = 'mixer'> = {
  proof: [T, ProvingManagerSetupInput<T>];
  destroy: undefined;
};
export interface ProvingManagerPayload extends Record<NoteProtocol, any> {
  mixer: MixerPMSetupInput;
  anchor: AnchorPMSetupInput;
  vanchor: VAnchorPMSetupInput;
}

/**
 * Proving Manager setup input for the proving manager over sdk-core
 * @param note - Serialized note representation
 * @param relayer - Relayer account id converted to hex string (Without a `0x` prefix)
 * @param recipient - Recipient account id converted to hex string (Without a `0x` prefix)
 * @param leaves - Leaves for generating the merkle path
 * @param leafIndex - The index of  the Leaf commitment
 * @param fee - The fee for the transaction
 * @param refund - The refund for the transaction
 * @param provingKey - Proving key bytes to pass in to the Zero-knowledge proof generation
 **/
export type MixerPMSetupInput = {
  note: string;
  relayer: string;
  recipient: string;
  leaves: Leaves;
  leafIndex: number;
  fee: number;
  refund: number;
  provingKey: Uint8Array;
};

/**
 * Proving Manager setup input for anchor API proving manager over sdk-core
 * @param note - Serialized note representation
 * @param relayer - Relayer account id converted to hex string (Without a `0x` prefix)
 * @param recipient - Recipient account id converted to hex string (Without a `0x` prefix)
 * @param leaves - Leaves for generating the merkle path
 * @param leafIndex - The index of  the Leaf commitment
 * @param fee - The fee for the transaction
 * @param refund - The refund for the transaction
 * @param provingKey - Proving key bytes to pass in to the Zero-knowledge proof generation
 * @param roots - Roots for anchor API
 * @param refreshCommitment - Refresh commitment in hex representation ( without prefix `0x` ) Required for anchor, ignored for the mixer
 * */
export type AnchorPMSetupInput = {
  note: string;
  relayer: string;
  recipient: string;
  leaves: Leaves;
  leafIndex: number;
  fee: number;
  refund: number;
  provingKey: Uint8Array;
  roots: Leaves;
  refreshCommitment: string;
};

/**
 * Proving Manager setup input for anchor API proving manager over sdk-core
 * @param inputNotes - VAnchor notes representing input UTXOs for proving
 * @param leavesMap - Leaves for generating the merkle path, it's indexed by the chain_id and for each entry the values are list of leaves for this chain
 * @param indices -  Leaf indices for input UTXOs leaves
 * @param roots - Roots set for every anchor
 * @param chainId - The chain id where the input UTXOs being spent
 * @param outputConfigs - Configuration to shape the output UTXOs
 * @param publicAmount - Amount the is used to tell the transaction type : Sum. of inputs + public amount = Sum. of outputs
 * @param externalDataHash - The hash of external data which contains other values (EX fees,relayer ,..etc)
 * @param provingKey - Proving key bytes to pass in to the Zero-knowledge proof generation
 * */
export type VAnchorPMSetupInput = {
  inputNotes: Note[];
  leavesMap: Record<string, Leaves>;
  indices: number[];
  roots: Leaves;
  chainId: string;
  output: [Utxo, Utxo];
  encryptedCommitments: [Uint8Array, Uint8Array],
  publicAmount: string;
  provingKey: Uint8Array;
  relayer: Uint8Array;
  recipient: Uint8Array;
  extAmount: string;
  fee: string;
};

export type ProofInterface<T extends NoteProtocol> = ProofPayload[T]

export interface ProofPayload extends Record<NoteProtocol, any> {
  mixer: MixerProof,
  anchor: AnchorProof,
  VAnchor: VAnchorProof
}

export type VAnchorProof = {
  readonly inputUtxos: Array<Utxo>;
  readonly outputNotes: Array<Note>;
  readonly proof: string;
  readonly publicInputs: Array<string>;
  readonly publicAmount: Uint8Array;
  readonly extDataHash: Uint8Array;
};

export type AnchorProof = {
  readonly nullifierHash: string;
  readonly proof: string;
  readonly root: string;
  readonly roots: Array<string>;
  readonly publicInputs: Array<string>;
  readonly leaf: Uint8Array
};

export type MixerProof = {
  readonly nullifierHash: string;
  readonly proof: string;
  readonly root: string;
  readonly publicInputs: Array<string>;
  readonly leaf: Uint8Array
};
