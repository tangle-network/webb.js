export async function main() {
  const wasm = await import('@webb-tools/wasm-utils');
  const noteString =
    'webb.mix-v1-EDG-0-185c1090215e9a66ed3ef8594a7403060df60ac2159537acb10684592d45eb2b16de70eff19a1f80828cf47a5d16502702ff3262acf54cd0b0d0dd7cc67ad415-Curve25519-Poseidon3-Bulletproofs-18-any-0';
  const noteBuilderInput = new wasm.NoteBuilderInput();
  noteBuilderInput.amount('.1');
  noteBuilderInput.curve('Bls381');
  noteBuilderInput.backend('Arkworks');
  noteBuilderInput.version('v1');
  noteBuilderInput.denomination('5');
  noteBuilderInput.hash_function('Poseidon5');
  noteBuilderInput.token_symbol('ETH');
  const note = new wasm.DepositNote(noteBuilderInput);
  console.log(note.serialize());
}
console.log('sleep');
main();
