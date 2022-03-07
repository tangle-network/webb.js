import { Note, NoteGenInput } from '../note';
import { expect } from 'chai';

describe('note constructor should work', () => {
  it.only('from `NoteGenInput`', async () => {
    const noteInput: NoteGenInput = {
      protocol: 'anchor',
      version: 'v2',
      targetChain: '1',
      targetIdentifyingData: '1',
      sourceChain: '1',
      sourceIdentifyingData: '1',
      backend: 'Circom',
      hashFunction: 'Poseidon',
      curve: 'Bn254',
      tokenSymbol: 'WEBB',
      amount: '1',
      denomination: '18',
      width: '4',
      exponentiation: '5',
    };

    const note = await Note.generateNote(noteInput);
    expect(note.note.amount).to.deep.equal('1');
    expect(note.note.denomination).to.deep.equal('18');
    expect(note.note.width).to.deep.equal('4');
    expect(note.note.exponentiation).to.deep.equal('5');
    expect(note.note.targetChainId).to.deep.equal('1');
    expect(note.note.targetIdentifyingData).to.deep.equal('1');
    expect(note.note.sourceChainId).to.deep.equal('1');
    expect(note.note.sourceIdentifyingData).to.deep.equal('1');
    expect(note.note.backend).to.deep.equal('Circom');
    expect(note.note.hashFunction).to.deep.equal('Poseidon');
    expect(note.note.curve).to.deep.equal('Bn254');
    expect(note.note.tokenSymbol).to.deep.equal('WEBB');
  });
});
