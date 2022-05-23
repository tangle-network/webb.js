// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prefer-promise-reject-errors */
import type { Backend, Curve, HashFunction, JsNote, NoteProtocol, Version } from '@webb-tools/wasm-utils';

/**
 * The note input used to generate a `Note` instance.
 *
 * @param protocol - The shielded pool protocol to use.
 * @param version - The version of the note to use.
 * @param sourceChain - The source chain id.
 * @param sourceIdentifyingData - Optional source identifying data.
 * @param targetChain - The target chain id.
 * @param targetIdentifyingData - Optional target identifying data.
 * @param backend - The backend to use. Different values include 'Arkworks' and 'Circom'
 * @param hashFunction - The hash function to use. Different values include 'Poseidon' and 'Pederson'
 * @param curve - The curve to use. Different values include 'Bn254' and 'Bls381'
 * @param tokenSymbol - The token symbol to use.
 * @param amount - The amount to use.
 * @param denomination - The denomination to use. Commonly used denominations include '18' for ETH and '12' for DOT
 * @param width - The width to use. Related to the amount of secret parameters hashed together.
 * @param secrets - Optional secrets to use. When passed, secret generation is skipped for the resulting note instance.
 * @param exponentiation - The exponentiation to use. This is the exponentiation of the SBOX hash function component (for Poseidon)
 * @param index - UTXO index. Useful identifying information for deposits in merkle trees.
 */
export type NoteGenInput = {
  protocol: NoteProtocol;
  version?: string;
  sourceChain: string;
  sourceIdentifyingData?: string;
  targetChain: string;
  targetIdentifyingData?: string;
  backend: Backend;
  hashFunction: HashFunction;
  curve: Curve;
  tokenSymbol: string;
  amount: string;
  denomination: string;
  secrets?: string;
  width: string;
  exponentiation: string;
  index?: number
};

/**
 * Note class using the WebAssembly note backend.
 *
 * The goal of this class is to provide a Note interface
 * that works both in Node.js and in the browser.
 */
export class Note {
  static CURRENT_VERSION: Version = 'v2';

  // Default constructor
  private constructor (readonly note: JsNote) {
  }

  /**
   * Gets the WebAssembly module for the target environment.
   * Supports the browser and Node.js.
   */
  private static get wasm () {
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
      return import('@webb-tools/wasm-utils/njs/wasm-utils-njs.js');
    } else {
      return import('@webb-tools/wasm-utils/wasm-utils.js');
    }
  }

  /**
   * Generate a default JsUtxo which will have both index,amount = 0
   * @returns A note class instance.
   */
  public getDefaultUtxoNote (): Note {
    const note = this.note.defaultUtxoNote();

    return new Note(note);
  }

  /**
   * Deserializes a note from a string.
   *
   * @param value - A serialized note.
   * @returns A note class instance.
   */
  public static async deserialize (value: string): Promise<Note> {
    try {
      const wasm = await Note.wasm;
      const depositNote = wasm.JsNote.deserialize(value);

      return new Note(depositNote);
    } catch (e: any) {
      return Promise.reject({
        code: e.code,
        data: e.data,
        message: e.error_message
      });
    }
  }

  /**
   * Turns a `Note` into a WebAssembly compatible `JsNote`.
   *
   * @returns The `JsNote` struct.
   */
  async toDepositNote (): Promise<JsNote> {
    const wasm = await Note.wasm;

    return wasm.JsNote.deserialize(this.serialize());
  }

  /**
   * Serializes the note to a string.
   *
   * @returns The serialized note.
   */
  public serialize (): string {
    return this.note.serialize();
  }

  /**
   * Gets the leaf commitment of the note depending
   * on the protocol.
   *
   * @returns Returns the leaf commitment of the note.
   */
  getLeaf (): Uint8Array {
    return this.note.getLeafCommitment();
  }

  /**
   * Generates a note using the relevant input data. Supports
   * the protocols defined in the WebAssembly note backend.
   *
   * ```typescript
   * // Generate an anchor note
   * const input: NoteGenInput = {
   *   protocol: 'anchor',
   *   version: 'v2',
   *   targetChain: '1',
   *   targetIdentifyingData: '1',
   *   sourceChain: '1',
   *   sourceIdentifyingData: '1',
   *   backend: 'Circom',
   *   hashFunction: 'Poseidon',
   *   curve: 'Bn254',
   *   tokenSymbol: 'WEBB',
   *   amount: '1',
   *   denomination: '18',
   *   width: '4',
   *   exponentiation: '5',
   * }
   *
   * const note = await Note.generateNote(input);
   * ```
   * @param noteGenInput - The input data for generating a note.
   * @returns
   */
  public static async generateNote (noteGenInput: NoteGenInput): Promise<Note> {
    try {
      const wasm = await Note.wasm;
      const noteBuilderInput = new wasm.JsNoteBuilder();

      noteBuilderInput.protocol(noteGenInput.protocol);
      noteBuilderInput.version(Note.CURRENT_VERSION);
      noteBuilderInput.targetChainId(noteGenInput.targetChain);
      noteBuilderInput.sourceChainId(noteGenInput.sourceChain);
      noteBuilderInput.backend(noteGenInput.backend);
      noteBuilderInput.hashFunction(noteGenInput.hashFunction);
      noteBuilderInput.curve(noteGenInput.curve);
      noteBuilderInput.tokenSymbol(noteGenInput.tokenSymbol);
      noteBuilderInput.amount(noteGenInput.amount);
      noteBuilderInput.denomination(noteGenInput.denomination);
      noteBuilderInput.width(noteGenInput.width);
      noteBuilderInput.exponentiation(noteGenInput.exponentiation);

      if (noteGenInput.secrets) {
        noteBuilderInput.setSecrets(noteGenInput.secrets);
      }

      if (noteGenInput.targetIdentifyingData) {
        noteBuilderInput.targetIdentifyingData(noteGenInput.targetIdentifyingData);
      }

      if (noteGenInput.sourceIdentifyingData) {
        noteBuilderInput.sourceIdentifyingData(noteGenInput.sourceIdentifyingData);
      }

      if (noteGenInput.index) {
        noteBuilderInput.index(String(noteGenInput.index));
      }

      const depositNote = noteBuilderInput.build();

      return new Note(depositNote);
    } catch (e: any) {
      return Promise.reject({
        code: e.code,
        data: e.data,
        message: e.error_message
      });
    }
  }
}
