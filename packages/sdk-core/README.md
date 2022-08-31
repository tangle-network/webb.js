# @webb-tools/sdk-core


#  Helpers for Zero-Knowledge and Note generation
The package provides a cleaner API to the underlying `wasm-utils`

# Deposit note
The note contains data about a deposit

# Note
```ts
// Note Generation input
const noteInput: NoteGenInput = {
  amount: '1',
  backend: 'Arkworks',
  curve: 'Bn254',
  denomination: '18',
  exponentiation: '5',
  hashFunction: 'Poseidon',
  protocol: 'vanchor',
  sourceChain: '1',
  sourceIdentifyingData: '1',
  targetChain: '1',
  targetIdentifyingData: '1',
  tokenSymbol: 'WEBB',
  version: 'v2',
  width: '5'
};

// Note GenInput
const note = await Note.generateNote(noteInput);
const noteStrng= note.serializedNote();
```

# Proving Manager
Proving manager uses `wasm-utils`, it runs in a Worker, or directly in the browser
```ts
const provingInput: ProvingManagerSetupInput = {
  leafIndex: 0,
  provingKey: Uint8Array.from([]),
  note: `webb://v1:vanchor/1:1/1:1/0000000000000001:0100000000000000000000000000000000000000000000000000000000000000:f5e1c9dc56e1032b09b88aaf81fa1aab9c3cb1c734d038814ef0bd987ec72103:13bcea7c5003590db4210351146232350067d59be059c6052d806b608d348300/?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=WEBB&denom=18&amount=1`,
  fee: 0,
  refund: 0,
  leaves: [],
  recipient: `4094436fd8a3d5541d3f3c08922d63eb3be5761be8a9e7c28c89445c358cb669`,
  relayer: `4094436fd8a3d5541d3f3c08922d63eb3be5761be8a9e7c28c89445c358cb669`,
  refreshCommitment:`0000000000000000000000000000000000000000000000000000000000000000`
};

// Run throw nodejs
const pm = new ProvingManager('direct-call');
const proofMangager = await pm.prove(proofInput);
```
