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
  protocol: 'anchor',
  sourceChain: '1',
  sourceIdentifyingData: '1',
  targetChain: '1',
  targetIdentifyingData: '1',
  tokenSymbol: 'WEBB',
  version: 'v2',
  width: '4'
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
  note: `webb://v2:anchor/1:1/1:1/0000000000000001:649798e6cb21ad4464294ef150085838217909d2438b06cbc0d52268033d901f:da82797e42c49c00d642a02ca9ef89db3b723c17c59d3a9e07b6a7cd8e356719/?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Arkworks&token=WEBB&denom=18&amount=1`,
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
