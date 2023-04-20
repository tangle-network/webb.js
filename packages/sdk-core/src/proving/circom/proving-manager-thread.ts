// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

// Import wasm-generated types
import type { NoteProtocol } from '@webb-tools/wasm-utils';

import * as snarkjs from 'snarkjs';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { MerkleProof, MerkleTree } from '../../merkle-tree.js';
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
      const inputUtxos = await Promise.all(input.inputUtxos.map((utxo) => CircomUtxo.deserialize(utxo)));

      if (inputUtxos.length !== input.leafIds.length) {
        throw new Error(
          `Input utxos and leaf identifiers don't match! utxos count (${inputUtxos.length}) ids count (${input.leafIds.length})`
        );
      }

      // Set the leaf index on the notes
      for (let i = 0; i < inputUtxos.length; i++) {
        inputUtxos[i].setIndex(input.leafIds[i].index);
      }

      // Account for empty leaves set on the merkle tree
      const firstInputLeaves = input.leavesMap[inputUtxos[0].originChainId ?? inputUtxos[0].chainId];

      let mt: MerkleTree = new MerkleTree(this.treeDepth, firstInputLeaves
        ? firstInputLeaves.map((u8a) => u8aToHex(u8a))
        : []);
      const merkleProofs: MerkleProof[] = [];

      // loop through the jsNotes and generate merkle proofs
      for (let i = 0; i < inputUtxos.length; i++) {
        // generate the merkle proof for this note. If it is a dummy utxo, return zeros
        if (inputUtxos[i].amount === '0') {
          merkleProofs.push({
            element: BigInt(0),
            merkleRoot: BigInt(u8aToHex(input.roots[0])),
            pathElements: new Array(this.treeDepth).fill(0),
            pathIndices: new Array(this.treeDepth).fill(0)
          });
        } else {
          mt = new MerkleTree(this.treeDepth, input.leavesMap[input.leafIds[i].typedChainId].map((u8a) => u8aToHex(u8a)));
          merkleProofs.push(mt.path(Number(inputUtxos[i].index)));
        }
      }

      if (inputUtxos.length > 16) {
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

      const outputUtxos = await Promise.all(input.output.map((utxoString) => CircomUtxo.deserialize(utxoString)));

      // Build the appropriate witnessCalculator for this circuit
      const witnessCalculator = await buildVariableWitnessCalculator(this.circuitWasm, 0);
      const witnessInput = generateVariableWitnessInput(
        input.roots.map((root) => BigInt(root.toString())),
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
        backend: 'Circom',
        extDataHash: hexToU8a(dataHash.toString(16)),
        inputUtxos: inputUtxos.map((utxo) => utxo.serialize()),
        outputUtxos: outputUtxos.map((utxo) => utxo.serialize()),
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
