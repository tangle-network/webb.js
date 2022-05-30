// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import type { Leaves, NoteProtocol } from '@webb-tools/wasm-utils';

import { ProofI } from '@webb-tools/sdk-core/proving/proving-manager.js';
import { JsProofInput, JsProofOutput, JsUtxo } from '@webb-tools/wasm-utils';
import { JsNote } from '@webb-tools/wasm-utils/njs';

import { u8aToHex } from '@polkadot/util';

import { Note } from '../note.js';

/**
 *
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

export type ProvingManagerSetupInput<T extends NoteProtocol> = ProvingManagerPayload[T];

type PMEvents<T extends NoteProtocol = 'mixer'> = {
  proof: [T, ProvingManagerSetupInput<T>];
  destroy: undefined;
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
  inputNotes: string[];
  leavesMap: Record<string, Leaves>;
  indices: number[];
  roots: Leaves;
  chainId: string;
  output: [JsUtxo, JsUtxo];
  encryptedCommitments: [Uint8Array, Uint8Array],
  publicAmount: string;
  provingKey: Uint8Array;
  relayer: Uint8Array;
  recipient: Uint8Array;
  extAmount: string;
  fee: string;
};

interface ProvingManagerPayload extends Record<NoteProtocol, any> {
  mixer: MixerPMSetupInput;
  anchor: AnchorPMSetupInput;
  vanchor: VAnchorPMSetupInput;
}

export class ProvingManagerWrapper {
  /**
   * @param ctx  - Context of the Proving manager
   * Defaults to worker mode assuming that the Proving manager is running in the browser
   * if it's set to direct-call which is done in nodejs then this is running without worker
   **/
  constructor (private ctx: 'worker' | 'direct-call' = 'worker') {
    // if the Manager is running in side worker it registers an event listener
    if (ctx === 'worker') {
      self.addEventListener('message', async (event) => {
        const message = event.data as Partial<PMEvents>;
        const key = Object.keys(message)[0] as keyof PMEvents;

        switch (key) {
          case 'proof':
            {
              const [protocol, input] = message.proof!;
              const proof = await this.prove(protocol, input);

              (self as unknown as Worker).postMessage({
                data: proof,
                name: key
              });
            }

            break;
          case 'destroy':
            (self as unknown as Worker).terminate();
            break;
        }
      });
    }
  }

  /**
   * Getter for wasm blob
   * for worker wasm it will resolve the browser build of wasm-utils,and Nodejs build for direct-call
   **/
  private get wasmBlob () {
    return this.ctx === 'worker'
      ? import('@webb-tools/wasm-utils/wasm-utils.js')
      : import('@webb-tools/wasm-utils/njs/wasm-utils-njs.js');
  }

  private get proofBuilder () {
    return this.wasmBlob.then((wasm) => {
      return wasm.JsProofInputBuilder;
    });
  }

  private async generateProof (proofInput: JsProofInput): Promise<JsProofOutput> {
    const wasm = await this.wasmBlob;

    return wasm.generate_proof_js(proofInput);
  }

  /**
   * Generate the Zero-knowledge proof from the proof input
   **/
  async prove<T extends NoteProtocol> (protocol: T, pmSetupInput: ProvingManagerSetupInput<T>): Promise<ProofI<T>> {
    const Manager = await this.proofBuilder;
    const pm = new Manager(protocol);

    if (protocol === 'mixer') {
      const input = pmSetupInput as MixerPMSetupInput;
      const { note } = await Note.deserialize(input.note);

      pm.setLeaves(input.leaves);
      pm.setRelayer(input.relayer);
      pm.setRecipient(input.recipient);
      pm.setLeafIndex(String(input.leafIndex));
      pm.setRefund(String(input.refund));
      pm.setFee(String(input.fee));
      pm.setPk(u8aToHex(input.provingKey).replace('0x', ''));
      pm.setNote(note);

      const proofInput = pm.build_js();
      const proofOutput = await this.generateProof(proofInput);
      const proof = proofOutput.mixerProof;

      const mixerProof: ProofI<'mixer'> = {
        nullifierHash: proof.nullifierHash,
        proof: proof.proof,
        root: proof.root
      };

      return mixerProof as any;
    } else if (protocol === 'anchor') {
      const input = pmSetupInput as AnchorPMSetupInput;
      const { note } = await Note.deserialize(input.note);

      pm.setLeaves(input.leaves);
      pm.setRelayer(input.relayer);
      pm.setRecipient(input.recipient);
      pm.setLeafIndex(String(input.leafIndex));
      pm.setRefund(String(input.refund));
      pm.setFee(String(input.fee));
      pm.setPk(u8aToHex(input.provingKey).replace('0x', ''));
      pm.setNote(note);
      pm.setRoots(input.roots);
      pm.setRefreshCommitment(input.refreshCommitment);

      const proofInput = pm.build_js();
      const proofOutput = await this.generateProof(proofInput);
      const proof = proofOutput.anchorProof;
      const anchorProof: ProofI<'anchor'> = {
        nullifierHash: proof.nullifierHash,
        proof: proof.proof,
        root: proof.root,
        roots: proof.roots
      };

      return anchorProof as any;
    } else if (protocol === 'vanchor') {
      const input = pmSetupInput as VAnchorPMSetupInput;
      const metaDataNote = input.inputNotes[0];
      const { note } = await Note.deserialize(metaDataNote);
      const rawNotes = await Promise.all(input.inputNotes.map((note) => Note.deserialize(note)));
      const jsNotes: JsNote[] = rawNotes.map((n) => n.note);
      const rawIndices = [...input.indices];
      const indices = rawIndices;

      if (rawNotes.length !== indices.length) {
        throw new Error(
          `Input notes and indices size don't match notes count (${rawNotes.length}) indices count (${indices.length})`
        );
      }

      // Pad the 1 note to make 2 inputs
      if (rawNotes.length === 1) {
        jsNotes.push(note.defaultUtxoNote());
        indices.push(0);
      }

      if (rawNotes.length > 2 && rawNotes.length < 16) {
        const inputGap = 16 - rawNotes.length;

        jsNotes.push(
          ...Array(inputGap)
            .fill(0)
            .map(() => note.defaultUtxoNote())
        );
        indices.push(...Array(inputGap).fill(0));
      }

      if (rawNotes.length > 16) {
        throw new Error('The maximum support input count is 16');
      }

      pm.setNotes(jsNotes);
      pm.setIndices(indices.map((i) => i.toString()) as any);
      pm.setPk(u8aToHex(input.provingKey).replace('0x', ''));
      pm.setRoots(input.roots);
      pm.chain_id(input.chainId);
      pm.public_amount(input.publicAmount);
      pm.setVanchorOutputConfig(...input.output);
      const wasm = await this.wasmBlob;
      const extData = new wasm.ExtData(
        input.recipient,
        input.relayer,
        input.extAmount,
        input.fee,
        input.encryptedCommitments[0],
        input.encryptedCommitments[1]
      );
      const dataHash = extData.get_encode();
      const dataHashhex = u8aToHex(dataHash).replace('0x', '');

      pm.setExtDatahash(dataHashhex);

      const leavesMap = new wasm.LeavesMapInput();

      for (const key of Object.keys(input.leavesMap)) {
        leavesMap.setChainLeaves(key as any, input.leavesMap[key]);
      }

      pm.setLeavesMap(leavesMap);

      const proofInput = pm.build_js();
      const proofOutput = await this.generateProof(proofInput);
      const proof = proofOutput.vanchorProof;
      const anchorProof: ProofI<'vanchor'> = {
        extDataHash: dataHash,
        inputUtxos: proof.inputUtxos,
        outputNotes: proof.outputNotes,
        proof: proof.proof,
        publicAmount: proof.publicAmount,
        publicInputs: proof.publicInputs
      };

      return anchorProof as any;
    } else {
      throw new Error('invalid protocol');
    }
  }
}
