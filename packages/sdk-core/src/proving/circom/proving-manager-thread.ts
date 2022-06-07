// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

// Import wasm-generated types
import type { JsNote, NoteProtocol } from '@webb-tools/wasm-utils';

import { JsUtxo } from '@webb-tools/wasm-utils/njs';
import { poseidon } from 'circomlibjs';
import { BigNumber } from 'ethers';
import * as snarkjs from 'snarkjs';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { MerkleProof, MerkleTree } from '../../merkle-tree.js';
import { Note } from '../../note.js';
import { buildFixedWitnessCalculator, buildVariableWitnessCalculator, generateFixedWitnessInput, generateVariableWitnessInput, generateWithdrawProofCallData, getVAnchorExtDataHash } from '../../solidity-utils/index.js';
import { AnchorPMSetupInput, ProofInterface, ProvingManagerSetupInput, VAnchorPMSetupInput } from '../types.js';

export class CircomProvingManagerWrapper {
  /**
   * @param circuitWasm - Circom requires a circuit.
   * @param ctx  - Context of the Proving manager - prove in a worker or on the main thread.
   **/
  constructor (private circuitWasm: any, private ctx: 'worker' | 'direct-call' = 'direct-call') {
    // if the Manager is running in side worker it registers an event listener
    if (ctx === 'worker') {
      console.log('yooooo I\'m trying to execute in a worker');
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

  /// TODO: Remove this and remove dependency over the JSUtxo
  private get wasmBlob () {
    return this.ctx === 'worker'
      ? import('@webb-tools/wasm-utils/wasm-utils.js')
      : import('@webb-tools/wasm-utils/njs/wasm-utils-njs.js');
  }

  /**
   * Generate the Zero-knowledge proof from the proof input
   **/
  async prove<T extends NoteProtocol> (protocol: T, pmSetupInput: ProvingManagerSetupInput<T>): Promise<ProofInterface<T>> {
    if (protocol === 'anchor') {
      const input = pmSetupInput as AnchorPMSetupInput;
      const { note } = await Note.deserialize(input.note);
      const noteSecretParts = note.secrets.split(':');
      const chainId = '0x' + noteSecretParts[0];
      const nullifier = '0x' + noteSecretParts[1];
      const secret = '0x' + noteSecretParts[2];
      const nullifierHash = BigNumber.from(poseidon([nullifier, nullifier]));

      // Generate the merkle proof from the passed leaves
      const mt = new MerkleTree(30, input.leaves.map((u8a) => u8aToHex(u8a)));
      const merkleProof = mt.path(input.leafIndex);

      // Build the appropriate witnessCalculator for this circuit
      const witnessCalculator = await buildFixedWitnessCalculator(this.circuitWasm, 0);
      const witnessInput = generateFixedWitnessInput(
        nullifier,
        nullifierHash.toHexString(),
        secret,
        chainId,
        input.refreshCommitment,
        input.recipient,
        input.relayer,
        BigInt(input.fee),
        BigInt(input.refund),
        input.roots.map((root) => u8aToHex(root)),
        merkleProof.pathElements,
        merkleProof.pathIndices
      );

      console.log('witnessInput: ', witnessInput);

      const witness = await witnessCalculator.calculateWTNSBin(witnessInput, 0);

      const proofEncoded = await this.snarkjsProveAndVerify(input.provingKey, witness);

      console.log('proofEncoded: ', proofEncoded);

      const anchorProof: ProofInterface<'anchor'> = {
        nullifierHash: nullifierHash.toHexString(),
        proof: `0x${proofEncoded}`,
        root: merkleProof.merkleRoot.toHexString(),
        roots: input.roots.map((root) => u8aToHex(root))
      };

      return anchorProof as any;
    } else if (protocol === 'vanchor') {
      const input = pmSetupInput as VAnchorPMSetupInput;
      const rawNotes = await Promise.all(input.inputNotes.map((note) => Note.deserialize(note)));
      const jsNotes: JsNote[] = rawNotes.map((n) => n.note);
      const indices = [...input.indices];

      if (rawNotes.length !== indices.length) {
        throw new Error(
          `Input notes and indices size don't match notes count (${rawNotes.length}) indices count (${indices.length})`
        );
      }

      // Set the leaf index on the jsNotes
      for (let i = 0; i < jsNotes.length; i++) {
        jsNotes[i].mutateIndex(indices[i].toString());
      }

      // sort input utxos
      jsNotes.sort((a, b) => Number(a.sourceChainId) - Number(b.sourceChainId));

      let currentChainId = jsNotes[0].sourceChainId;
      let mt: MerkleTree = new MerkleTree(30, input.leavesMap[(jsNotes[0].sourceChainId)].map((u8a) => u8aToHex(u8a)));
      const merkleProofs: MerkleProof[] = [];

      // loop through the jsNotes and generate merkle proofs
      for (let i = 0; i < jsNotes.length; i++) {
        // look at the sourceChain of the jsNote, and determine if a new merkle tree needs to be created
        if (jsNotes[i].sourceChainId !== currentChainId) {
          mt = new MerkleTree(30, input.leavesMap[(jsNotes[i].sourceChainId)].map((u8a) => u8aToHex(u8a)));
          currentChainId = jsNotes[i].sourceChainId;
        }

        // generate the merkle proof for this note
        merkleProofs.push(mt.path(Number(jsNotes[i].index)));
      }

      // Add extra dummy utxos to fit the circuit
      if (rawNotes.length === 1) {
        jsNotes.push(jsNotes[0].defaultUtxoNote());
        indices.push(0);
        merkleProofs.push({
          element: BigNumber.from(0),
          merkleRoot: BigNumber.from(mt.root()),
          pathElements: new Array(30).fill(0),
          pathIndices: new Array(30).fill(0)
        });
      }

      if (rawNotes.length > 2 && rawNotes.length < 16) {
        const inputGap = 16 - rawNotes.length;

        jsNotes.push(
          ...Array(inputGap)
            .fill(0)
            .map(() => jsNotes[0].defaultUtxoNote())
        );
        indices.push(...Array(inputGap).fill(0));
        merkleProofs.push({
          element: BigNumber.from(0),
          merkleRoot: BigNumber.from(mt.root()),
          pathElements: new Array(30).fill(0),
          pathIndices: new Array(30).fill(0)
        });
      }

      if (rawNotes.length > 16) {
        throw new Error('The maximum support input count is 16');
      }

      const dataHash = getVAnchorExtDataHash(
        u8aToHex(input.encryptedCommitments[0]),
        u8aToHex(input.encryptedCommitments[1]),
        input.extAmount,
        input.fee,
        u8aToHex(input.recipient),
        u8aToHex(input.relayer)
      );

      // create JsUTXOs for the inputs
      const inputUtxos = jsNotes.map((note) => note.getUtxo());

      // create JsNotes for the outputs
      // The output UTXO will have its sourceChainId as the targetChainId of the input UTXOs
      // The output UTXO will have its targetChainId = sourceChainId
      // TODO: Investigate if we can modify the above statement to other chains.
      const outputNotes: Note[] = [];
      // TODO remove wasm dependency
      const wasm = await this.wasmBlob;
      const outputUtxos = input.outputParams?.map((params) => new wasm.JsUtxo(
        params.curve,
        params.backend,
        params.inputSize,
        params.anchorSize,
        params.amount,
        params.chainId,
        params.index,
        params.privateKey,
        params.blinding
      )) ?? input.output as JsUtxo[];

      for (const utxo of outputUtxos) {
        const secrets = [utxo.chainIdBytes, utxo.amount, '', utxo.blinding].join(':');

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
          sourceChain: utxo.chainIdBytes,
          sourceIdentifyingData: jsNotes[0].targetIdentifyingData,
          targetChain: utxo.chainIdBytes,
          targetIdentifyingData: jsNotes[0].targetIdentifyingData,
          tokenSymbol: jsNotes[0].tokenSymbol,
          version: 'v2',
          width: '5'
        });

        outputNotes.push(note);
      }

      // Build the appropriate witnessCalculator for this circuit
      const witnessCalculator = await buildVariableWitnessCalculator(this.circuitWasm, 0);
      const witnessInput = generateVariableWitnessInput(
        merkleProofs.map((proof) => proof.merkleRoot),
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

      const anchorProof: ProofInterface<'vanchor'> = {
        extDataHash: hexToU8a(dataHash.toHexString()),
        inputUtxos,
        outputNotes,
        proof: `0x${proofEncoded}`,
        publicAmount: hexToU8a(input.publicAmount),
        // public inputs on ProofInterface not required for verifying in circom
        publicInputs: []
      };

      return anchorProof as any;
    } else {
      throw new Error('invalid protocol');
    }
  }
}
