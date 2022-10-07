// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// This file is meant to host types that are used for proving
// It exposes the typed inputs and outputs for sdk-core for external use.

import type { Leaves, NoteProtocol } from '@webb-tools/wasm-utils';

import { Utxo } from '../utxo.js';

export type ProvingManagerSetupInput<T extends NoteProtocol> = ProvingManagerPayload[T];

export type PMEvents<T extends NoteProtocol = 'mixer'> = {
  proof: [T, ProvingManagerSetupInput<T>];
  destroy: undefined;
};
export interface ProvingManagerPayload extends Record<NoteProtocol, any> {
  mixer: MixerPMSetupInput;
  vanchor: VAnchorPMSetupInput;
}

/**
 * Interface to pass as parameter for proving managers.
 * Corresponds to the respective inputUtxo at the same index.
 * @param index - Index of the leaf in the tree
 * @param chainId - The typedChainId index into the leavesMap.
 */
export interface LeafIdentifier {
  index: number,
  typedChainId: number
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
 * @param inputNotes - VAnchor notes representing input UTXOs for proving
 * @param leavesMap - Leaves for generating the merkle path, it's indexed by the chain_id and for each entry the values are list of leaves for this chain
 * @param leafIds -  Identify a leaf's <index> for leaves at <typedChainId>'s entry in the leavesMap
 * @param roots - Roots set for every anchor
 * @param chainId - The chain id where the input UTXOs being spent
 * @param output - Configuration to shape the output UTXOs
 * @param encryptedCommitments - Encrypted commitments for the output UTXOs
 * @param publicAmount - Amount the is used to tell the transaction type : Sum. of inputs + public amount = Sum. of outputs
 * @param provingKey - Proving key bytes to pass in to the Zero-knowledge proof generation
 * @param relayer - Relayer account ID or address
 * @param recipient - Recipient account ID or address
 * @param extAmount - External amount being deposited or withdrawn
 * @param fee - Fee for the transaction
 * @param refund - Refund for the transaction
 * @param token - The optional token to unwrap into upon withdrawal
 * */
export type VAnchorPMSetupInput = {
  inputUtxos: Utxo[];
  leavesMap: Record<string, Leaves>;
  leafIds: LeafIdentifier[];
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
  refund: string;
  token: Uint8Array;
};

export type ProofInterface<T extends NoteProtocol> = ProofPayload[T]

export interface ProofPayload extends Record<NoteProtocol, any> {
  mixer: MixerProof,
  VAnchor: VAnchorProof
}

/**
 * Proving Manager proof output for the VAnchor
 * @param inputUtxos - The input UTXOs for the transaction
 * @param outputUtxos - The output UTXOs for the transaction
 * @param proof - The proof for the transaction
 * @param publicInputs - Array of public inputs for the proof
 * @param publicAmount - The public amount for the transaction
 * @param extDataHash - The hash of all external data parameters for the transaction
 */
export type VAnchorProof = {
  readonly inputUtxos: Array<Utxo>;
  readonly outputUtxos: Array<Utxo>;
  readonly proof: string;
  readonly publicInputs: Array<string>;
  readonly publicAmount: Uint8Array;
  readonly extDataHash: Uint8Array;
};

/**
 * Proving Manager proof output for Mixer
 * @param nullifierHash - The nullifier hash for the transaction
 * @param proof - The proof for the transaction
 * @param root - The merkle root for the transaction
 * @param publicInputs - Array of public inputs for the proof
 * @param leaf - The leaf of the deposit being proven
 */
export type MixerProof = {
  readonly nullifierHash: string;
  readonly proof: string;
  readonly root: string;
  readonly publicInputs: Array<string>;
  readonly leaf: Uint8Array
};
