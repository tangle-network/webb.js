// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import type { Leaves, NoteProtocol, OutputUtxoConfig } from '@webb-tools/wasm-utils';

import { ProofI } from '@webb-tools/sdk-core/proving/proving-manager.js';
import { JsProofInput, JsProofOutput } from '@webb-tools/wasm-utils';
import { JsNote } from '@webb-tools/wasm-utils/njs';

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
}

export type ProvingManagerSetupInput<T extends NoteProtocol> = ProvingManagerPayload[T];

type PMEvents<T extends NoteProtocol = 'mixer'> = {
  proof: [T, ProvingManagerSetupInput<T>];
  destroy: undefined;
};

/**
 * @param roots - Roots for anchor API
 * @param refreshCommitment - Refresh commitment in hex representation ( without prefix `0x` ) Required for anchor, ignored for the mixer
 * */
export type AnchorPMSetupInput = MixerPMSetupInput & {
  roots: Leaves;
  refreshCommitment: string;
}

export type VAnchorPMSetupInput = {
  inputNotes: string[];
  provingKey: Uint8Array;
  leavesMap: Record<string, Leaves>,
  roots: Leaves;
  chainId: string;
  outputConfigs: [OutputUtxoConfig, OutputUtxoConfig];
  indices: number[];
  publicAmount: string;
  metaDataNote?: string;
  externalDataHash: string;
}

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
          case 'proof': {
            const [proto, input] = message.proof!;
            const proof = await this.proof(proto, input);

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
  async proof<T extends NoteProtocol> (
    protocol: T,
    pmSetupInput: ProvingManagerSetupInput<T>): Promise<ProofI<T>> {
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
    } else if (protocol === 'vanchor') {
      const input = pmSetupInput as VAnchorPMSetupInput;
      const metaDataNote = input.metaDataNote || input.inputNotes[0];
      const { note } = await Note.deserialize(metaDataNote);
      const rawNotes = await Promise.all(input.inputNotes.map((note) => Note.deserialize(note)));
      const jsNotes: JsNote[] = rawNotes.map((n) => n.note);
      const rawIndices = [...input.indices];
      const indices = rawIndices;

      if (rawNotes.length !== indices.length) {
        throw new Error(`Input notes and indices size don't match notes count (${rawNotes.length}) indices count (${indices.length})`);
      }

      // Pad the 1 note to make 2 inputs
      if (rawNotes.length === 1) {
        jsNotes.push(note.defaultUtxoNote());
        indices.push(0);
      }

      if (rawNotes.length > 2 && rawNotes.length < 16) {
        const inputGap = 16 - rawNotes.length;
        const defaultNote = note.defaultUtxoNote();

        jsNotes.push(...Array(inputGap).fill(defaultNote));
        indices.push(...Array(inputGap).fill(0));
      }

      if (rawNotes.length > 16) {
        throw new Error('The maximum support input count is 16');
      }

      pm.setNote(note);
      pm.setNotes(jsNotes);
      pm.setIndices(indices.map((i) => i.toString()) as any);
      pm.setPk(u8aToHex(input.provingKey).replace('0x', ''));
      pm.setRoots(input.roots);
      pm.chain_id(input.chainId);
      pm.public_amount(input.publicAmount);
      pm.setVanchorOutputConfig(...input.outputConfigs);
      pm.setExtDatahash(input.externalDataHash);
      // leaves insertion
      const wasm = await this.wasmBlob;
      const leavesMap = new wasm.LeavesMapInput();

      for (const key of Object.keys(input.leavesMap)) {
        leavesMap.setChainLeaves(key as any, input.leavesMap[key]);
      }

      pm.setLeavesMap(leavesMap);
    } else {
      throw new Error('invalid protocol');
    }

    const proofInput = pm.build_js();

    const proofOutput = await this.generateProof(proofInput);

    // Mixer and anchor share the same proof type
    if (protocol === 'mixer' || protocol === 'anchor') {
      const proof = proofOutput.proof;

      const proofPayload: ProofI<'anchor'> = {
        nullifierHash: proof.nullifierHash,
        proof: proof.proof,
        root: proof.root,
        roots: proof.roots
      };

      return proofPayload as any;
    } else {
      const proof = proofOutput.vanchorProof;

      const proofPayload: ProofI<'vanchor'> = {
        inputUtxos: proof.inputUtxos,
        outputNotes: proof.outputNotes,
        proof: proof.proof,
        publicInputs: proof.publicInputs
      };

      return proofPayload as any;
    }
  }
}

/* Copied code from @polkadot.js to avoid calling polkadot dependencies in
   a web worker context. Issue: https://github.com/polkadot-js/common/issues/1435
*/

const U8_TO_HEX = new Array<any>(256);
const U16_TO_HEX = new Array<any>(256 * 256);
const HEX_TO_U8 = {};
const HEX_TO_U16 = {};

for (let n = 0; n < 256; n++) {
  const hex = n.toString(16).padStart(2, '0');

  U8_TO_HEX[n] = hex;
  // @ts-ignore
  HEX_TO_U8[hex] = n;
}

for (let i = 0; i < 256; i++) {
  for (let j = 0; j < 256; j++) {
    const hex = U8_TO_HEX[i] + U8_TO_HEX[j];
    const n = i << 8 | j;

    U16_TO_HEX[n] = hex;
    // @ts-ignore
    HEX_TO_U16[hex] = n;
  }
}

// @ts-ignore
function hex (value) {
  const mod = value.length % 2;
  const length = value.length - mod;
  const dv = new DataView(value.buffer, value.byteOffset);
  let result = '';

  for (let i = 0; i < length; i += 2) {
    result += U16_TO_HEX[dv.getUint16(i)];
  }

  if (mod) {
    result += U8_TO_HEX[dv.getUint8(length)];
  }

  return result;
}

// @ts-ignore
export function u8aToHex (value, bitLength = -1, isPrefixed = true) {
  const length = Math.ceil(bitLength / 8);

  return `${isPrefixed ? '0x' : ''}${!value || !value.length ? '' : length > 0 && value.length > length ? `${hex(value.subarray(0, length / 2))}…${hex(value.subarray(value.length - length / 2))}` : hex(value)}`;
}
