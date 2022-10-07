// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import type { JsProofInput, JsProofOutput, NoteProtocol } from '@webb-tools/wasm-utils';

import { u8aToHex } from '@polkadot/util';

import { Note } from '../../note.js';
import { Utxo } from '../../utxo.js';
import { MixerPMSetupInput, PMEvents } from '../types.js';
import { WorkerProofInterface, WorkerProvingManagerSetupInput, WorkerVAnchorPMSetupInput } from '../worker-utils.js';

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
  async prove<T extends NoteProtocol> (protocol: T, pmSetupInput: WorkerProvingManagerSetupInput<T>): Promise<WorkerProofInterface<T>> {
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

      const mixerProof: WorkerProofInterface<'mixer'> = {
        leaf: proof.leaf,
        nullifierHash: proof.nullifierHash,
        proof: proof.proof,
        publicInputs: proof.publicInputs,
        root: proof.root
      };

      return mixerProof as any;
    } else if (protocol === 'vanchor') {
      const input = pmSetupInput as WorkerVAnchorPMSetupInput;
      const inputUtxos = await Promise.all(input.inputUtxos.map((utxo) => Utxo.deserialize(utxo)));
      const leafIds = [...input.leafIds];

      if (inputUtxos.length !== leafIds.length) {
        throw new Error(
          `Input utxos and leaf ids size don't match! utxo count (${inputUtxos.length}) ids count (${leafIds.length})`
        );
      }

      // Pad the 1 note to make 2 inputs
      if (inputUtxos.length === 1) {
        const dummyUtxo = await Utxo.generateUtxo({
          amount: '0',
          backend: 'Arkworks',
          chainId: inputUtxos[0].chainId,
          curve: 'Bn254',
          index: '0',
          keypair: inputUtxos[0].getKeypair()
        });

        inputUtxos.push(dummyUtxo);
        leafIds.push({ index: 0, typedChainId: Number(inputUtxos[0].chainId) });
      }

      if (inputUtxos.length > 2 && inputUtxos.length < 16) {
        const inputGap = 16 - inputUtxos.length;
        const gap = await Promise.all(Array(inputGap)
          .fill(0)
          .map(async () => {
            const dummyUtxo = await Utxo.generateUtxo({
              amount: '0',
              backend: 'Arkworks',
              chainId: inputUtxos[0].chainId,
              curve: 'Bn254',
              index: '0',
              keypair: inputUtxos[0].getKeypair()
            });

            return dummyUtxo;
          }));

        inputUtxos.push(
          ...gap
        );
        leafIds.push(...Array(inputGap).fill({
          index: 0,
          typedChainId: Number(inputUtxos[0].chainId)
        }));
      }

      if (inputUtxos.length > 16) {
        throw new Error('The maximum support input count is 16');
      }

      // get the wasm blob for generating JsUtxos
      const wasm = await this.wasmBlob;
      const outputUtxos = await Promise.all(input.output.map((utxoString) => Utxo.deserialize(utxoString)));

      pm.setInputUtxos(inputUtxos.map((utxo) => utxo.inner));
      pm.setIndices(leafIds.map((i) => i.index.toString()) as any);
      pm.setPk(u8aToHex(input.provingKey).replace('0x', ''));
      pm.setRoots(input.roots);
      pm.chain_id(input.chainId);
      pm.public_amount(input.publicAmount);
      pm.setOutputUtxos(outputUtxos[0].inner, outputUtxos[1].inner);

      const extData = new wasm.ExtData(
        input.recipient,
        input.relayer,
        input.extAmount,
        input.fee,
        input.refund,
        input.token,
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
      const vanchorProof: WorkerProofInterface<'vanchor'> = {
        extDataHash: dataHash,
        inputUtxos: proof.inputUtxos.map((jsUtxo) => new Utxo(jsUtxo).serialize()),
        outputUtxos: proof.outputUtxos.map((jsUtxo) => new Utxo(jsUtxo).serialize()),
        proof: proof.proof,
        publicAmount: proof.publicAmount,
        publicInputs: proof.publicInputs
      };

      return vanchorProof;
    } else {
      throw new Error('invalid protocol');
    }
  }
}
