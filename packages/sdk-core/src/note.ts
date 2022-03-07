import type { Backend, Curve, HashFunction, JsNote, NoteProtocol } from '@webb-tools/wasm-utils';

const IS_NODE = typeof process === 'object' && typeof require === 'function';

export type NoteGenInput = {
  protocol: NoteProtocol;
  version: string;
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
};

export class Note {
  // Default constructor
  private constructor(readonly note: JsNote) {
  }

  private static get wasm() {
    if (typeof process === 'object') {
      return import('@webb-tools/wasm-utils/njs');
    } else {
      return import('@webb-tools/wasm-utils');
    }
  }

  public static async deserialize(value: string): Promise<Note> {
    const wasm = await Note.wasm;
    const depositNote = wasm.JsNote.deserialize(value);
    return new Note(depositNote);
  }

  async toDepositNote(): Promise<JsNote> {
    const wasm = await Note.wasm;
    return wasm.JsNote.deserialize(this.serialize());
  }

  public serialize(): string {
    return this.note.serialize();
  }

  getLeaf(): Uint8Array {
    return this.note.getLeafCommitment();
  }

  public static async generateNote(noteGenInput: NoteGenInput): Promise<Note> {
    let OperationError;
    if (IS_NODE) {
      OperationError = require('@webb-tools/wasm-utils/njs').OperationError;
    } else {
      OperationError = require('@webb-tools/wasm-utils').OperationError;
    }

    try {
      const wasm = await Note.wasm;
      const noteBuilderInput = new wasm.JsNoteBuilder();
      noteBuilderInput.protocol(noteGenInput.protocol);
      noteBuilderInput.version('v2');
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
      const depositNote = noteBuilderInput.build();
      return new Note(depositNote);
    } catch (e: typeof OperationError) {
      const errorMessage = {
        code: e.code,
        errorMessage: e.error_message,
        data: e.data,
      };
      throw errorMessage;
    }
  }
}
