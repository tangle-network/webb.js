export async function main() {
  const wasm = await import('@webb-tools/wasm-utils');
  const noteString =
    'webb.mix-v1-EDG-0-185c1090215e9a66ed3ef8594a7403060df60ac2159537acb10684592d45eb2b16de70eff19a1f80828cf47a5d16502702ff3262acf54cd0b0d0dd7cc67ad415-Curve25519-Poseidon3-Bulletproofs-18-any-0';
  const note = wasm.DepositNote.deserialize(noteString);
  console.log(note.amount);
  console.log(note.backend);
  console.log(note.curve);
}
main();
