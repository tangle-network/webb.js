// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { JsNote, JsProofInput, JsProofOutput, NoteProtocol } from '@webb-tools/wasm-utils';

import { u8aToHex } from '@polkadot/util';

import { Note } from '../../note.js';
import { AnchorPMSetupInput, MixerPMSetupInput, PMEvents, ProofInterface, ProvingManagerSetupInput, VAnchorPMSetupInput } from '../types.js';

export class ArkworksProvingManagerThread {
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
  async prove<T extends NoteProtocol> (protocol: T, pmSetupInput: ProvingManagerSetupInput<T>): Promise<ProofInterface<T>> {
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

      const mixerProof: ProofInterface<'mixer'> = {
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
      const anchorProof: ProofInterface<'anchor'> = {
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
      pm.setOutputUtxos(...input.output);
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
      const anchorProof: ProofInterface<'vanchor'> = {
        extDataHash: dataHash,
        inputUtxos: proof.inputUtxos,
        outputNotes: proof.outputNotes.map((jsNote) => Note.fromDepositNote(jsNote)),
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
