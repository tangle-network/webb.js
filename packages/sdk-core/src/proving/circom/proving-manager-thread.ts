// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

// Import wasm-generated types
import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { BigNumber } from 'ethers';
import * as snarkjs from 'snarkjs';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { toFixedHex } from '../../big-number-utils.js';
import { Keypair } from '../../keypair.js';
import { MerkleProof, MerkleTree } from '../../merkle-tree.js';
import { Note } from '../../note.js';
import { buildVariableWitnessCalculator, CircomUtxo, generateVariableWitnessInput, generateWithdrawProofCallData, getVAnchorExtDataHash } from '../../solidity-utils/index.js';
import { PMEvents } from '../types.js';
import { WorkerProofInterface, WorkerProvingManagerSetupInput, WorkerVAnchorPMSetupInput } from '../worker-utils.js';

export class CircomProvingManagerThread {
  /**
   * @param circuitWasm - Circom requires a circuit.
   * @param ctx  - Context of the Proving manager - prove in a worker or on the main thread.
   **/
  constructor (private circuitWasm: any, private treeDepth: number, private ctx: 'worker' | 'direct-call' = 'direct-call') {
    // if the Manager is running in side worker it registers an event listener
    if (this.ctx === 'worker') {
      self.addEventListener('message', async (event) => {
        type IPMEvents = PMEvents & { setup: { circuitWasm: any, treeDepth: number } };
        const message = event.data as IPMEvents;
        const key = Object.keys(message)[0] as keyof IPMEvents;

        switch (key) {
          case 'proof': {
            const [protocol, input] = message.proof;
            const proof = await this.prove(protocol, input);

            (self as unknown as Worker).postMessage({
              data: proof,
              name: key
            });
          }

            break;
          case 'setup':
            this.circuitWasm = message.setup.circuitWasm;
            this.treeDepth = message.setup?.treeDepth;
            (self as unknown as Worker).postMessage({
              data: null,
              name: 'setup'
            });
            break;
          case 'destroy':
            (self as unknown as Worker).terminate();
            break;
        }
      });
    }
  }

  async snarkjsProveAndVerify (provingKey: Uint8Array, witness: any): Promise<string> {
    let res = await snarkjs.groth16.prove(provingKey, witness);

    const proof = res.proof;
    const publicSignals = res.publicSignals;

    const vKey = await snarkjs.zKey.exportVerificationKey(provingKey);

    res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    return generateWithdrawProofCallData(proof, publicSignals);
  }

  /**
   * Generate the Zero-knowledge proof from the proof input
   **/
  async prove<T extends NoteProtocol> (protocol: T, pmSetupInput: WorkerProvingManagerSetupInput<T>): Promise<WorkerProofInterface<T>> {
    if (protocol === 'vanchor') {
      const input = pmSetupInput as WorkerVAnchorPMSetupInput;
      const notes = await Promise.all(input.inputNotes.map((note) => Note.deserialize(note)));
      const indices = [...input.indices];

      if (notes.length !== indices.length) {
        throw new Error(
          `Input notes and indices size don't match notes count (${notes.length}) indices count (${indices.length})`
        );
      }

      // Set the leaf index on the notes
      for (let i = 0; i < notes.length; i++) {
        notes[i].mutateIndex(indices[i].toString());
      }

      // Account for empty leaves set on the merkle tree
      let mt: MerkleTree = new MerkleTree(this.treeDepth, input.leavesMap[notes[0].note.sourceChainId]
        ? input.leavesMap[(notes[0].note.sourceChainId)].map((u8a) => u8aToHex(u8a))
        : []);
      const merkleProofs: MerkleProof[] = [];

      // loop through the jsNotes and generate merkle proofs
      for (let i = 0; i < notes.length; i++) {
        // generate the merkle proof for this note. If it is a dummy utxo, return zeros
        if (notes[i].note.amount === '0') {
          merkleProofs.push({
            element: BigNumber.from(0),
            merkleRoot: BigNumber.from(u8aToHex(input.roots[0])),
            pathElements: new Array(this.treeDepth).fill(0),
            pathIndices: new Array(this.treeDepth).fill(0)
          });
        } else {
          mt = new MerkleTree(this.treeDepth, input.leavesMap[(notes[i].note.sourceChainId)].map((u8a) => u8aToHex(u8a)));

          merkleProofs.push(mt.path(Number(notes[i].note.index)));
        }
      }

      if (notes.length > 16) {
        throw new Error('The maximum support input count is 16');
      }

      const dataHash = getVAnchorExtDataHash(
        u8aToHex(input.encryptedCommitments[0]),
        u8aToHex(input.encryptedCommitments[1]),
        input.extAmount,
        input.fee,
        u8aToHex(input.recipient),
        u8aToHex(input.relayer),
        input.refund,
        u8aToHex(input.token)
      );

      // create utxos for the inputs
      const inputUtxos = await Promise.all(notes.map((note) => {
        const secrets = note.note.secrets.split(':');

        return CircomUtxo.generateUtxo({
          amount: BigNumber.from(`0x${secrets[1]}`).toString(),
          backend: note.note.backend,
          blinding: hexToU8a(`0x${secrets[3]}`),
          chainId: note.note.targetChainId,
          curve: note.note.curve,
          index: note.note.index,
          keypair: new Keypair(`0x${secrets[2]}`),
          privateKey: hexToU8a(secrets[2])
        });
      }));

      // create JsNotes for the outputs
      // The output UTXO will have its sourceChainId as the targetChainId of the input UTXOs
      // The output UTXO will have its targetChainId = sourceChainId
      // TODO: Investigate if we can modify the above statement to other chains.
      const outputNotes: Note[] = [];

      for (const utxoString of input.output) {
        const utxo = await CircomUtxo.deserialize(utxoString);
        const secrets = [toFixedHex(utxo.chainId, 8), toFixedHex(utxo.amount), utxo.secret_key, utxo.blinding].join(':');

        const note = await Note.generateNote({
          amount: utxo.amount,
          backend: 'Circom',
          curve: 'Bn254',
          denomination: '18',
          exponentiation: '5',
          hashFunction: 'Poseidon',
          index: utxo.index,
          privateKey: hexToU8a(utxo.secret_key),
          protocol: 'vanchor',
          secrets,
          sourceChain: utxo.chainId,
          sourceIdentifyingData: notes[0].note.targetIdentifyingData,
          targetChain: utxo.chainId,
          targetIdentifyingData: notes[0].note.targetIdentifyingData,
          tokenSymbol: notes[0].note.tokenSymbol,
          version: 'v2',
          width: '5'
        });

        outputNotes.push(note);
      }

      const outputUtxos = await Promise.all(input.output.map((utxoString) => CircomUtxo.deserialize(utxoString)));

      // Build the appropriate witnessCalculator for this circuit
      const witnessCalculator = await buildVariableWitnessCalculator(this.circuitWasm, 0);
      const witnessInput = generateVariableWitnessInput(
        input.roots.map((root) => BigNumber.from(root)),
        input.chainId,
        inputUtxos,
        outputUtxos,
        input.extAmount,
        input.fee,
        dataHash,
        merkleProofs
      );

      const witness = await witnessCalculator.calculateWTNSBin(witnessInput, 0);
      const proofEncoded = await this.snarkjsProveAndVerify(input.provingKey, witness);

      const vanchorProof: WorkerProofInterface<'vanchor'> = {
        extDataHash: hexToU8a(dataHash.toHexString()),
        inputUtxos: inputUtxos.map((utxo) => utxo.serialize()),
        outputNotes: outputNotes.map((note) => note.serialize()),
        proof: proofEncoded,
        publicAmount: hexToU8a(input.publicAmount),
        // public inputs on ProofInterface not required for verifying in circom
        publicInputs: []
      };

      return vanchorProof;
    } else {
      throw new Error('invalid protocol');
    }
  }
}
