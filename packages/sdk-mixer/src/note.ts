import { Asset } from '@webb-tools/sdk-mixer';
import type { DepositNote, Backend, Curve, HashFunction } from '@webb-tools/wasm-utils';
export type NoteGenInput = {
  prefix: string;
  version: string;
  chain: string;
  backend: Backend;
  hashFunction: HashFunction;
  curve: Curve;
  tokenSymbol: string;
  amount: string;
  denomination: string;
};

export class Note {
  // Default constructor
  private constructor(readonly note: DepositNote) {}

  private static get wasm() {
    return import('@webb-tools/wasm-utils');
  }

  public static async deserialize(value: string): Promise<Note> {
    const wasm = await Note.wasm;
    const depositNote = wasm.DepositNote.deserialize(value);
    return new Note(depositNote);
  }

  async toDepositNote(): Promise<DepositNote> {
    const wasm = await Note.wasm;
    return wasm.DepositNote.deserialize(this.serialize());
  }

  public serialize(): string {
    return this.note.serialize();
  }

  public static async generateNote(noteGenInput: NoteGenInput): Promise<Note> {
    const wasm = await Note.wasm;
    const noteBuilderInput = new wasm.NoteBuilderInput();
    noteBuilderInput.prefix(noteGenInput.prefix);
    noteBuilderInput.version('v1');
    noteBuilderInput.chain(noteGenInput.chain);
    noteBuilderInput.backend(noteGenInput.backend);
    noteBuilderInput.hashFunction(noteGenInput.hashFunction);
    noteBuilderInput.curve(noteGenInput.curve);
    noteBuilderInput.tokenSymbol(noteGenInput.tokenSymbol);
    noteBuilderInput.amount(noteGenInput.amount);
    noteBuilderInput.denomination(noteGenInput.denomination);
    const depositNote = new wasm.DepositNote(noteBuilderInput);
    return new Note(depositNote);
  }

  public asAsset(): Asset {
    throw new Error('not implemented');
  }
}
