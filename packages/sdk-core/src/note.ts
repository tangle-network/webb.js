import type { Backend, Curve, HashFunction, JsNote, NoteProtocol } from "@webb-tools/wasm-utils";

export type NoteGenInput = {
  protocol: NoteProtocol;
  version: string;
  chain: string;
  targetIdentifyingData?: string;
  sourceChain: string;
  sourceIdentifyingData?: string;
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
    // if (typeof "process" !== "undefined" && process && process.versions && process.versions.node) {
    //   return import("@webb-tools/wasm-utils/build/njs");
    // }
    return import("@webb-tools/wasm-utils");
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
    const wasm = await Note.wasm;
    const noteBuilderInput = new wasm.JsNoteBuilder();
    noteBuilderInput.protocol(noteGenInput.protocol);
    noteBuilderInput.version("v2");
    noteBuilderInput.targetChainId(noteGenInput.chain);
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
  }
}
