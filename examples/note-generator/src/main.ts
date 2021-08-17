import { hexToU8a } from '@polkadot/util';

export async function main() {
  const wasm = await import('@webb-tools/wasm-utils');
  const leaves = [
    '0x2e5c62af48845c095bfa9b90b8ec9f6b7bd98fb3ac2dd3039050a64b919951dd',
    '0x3007c62f678a503e568534487bc5b0bc651f37bbe1f34668b4c8a360f15ba3c3',
    '0x1ec12c8b3db99467523b352191a93e206d9193e9ca4e6162828f89f375876fba',
    '0x235c395fb58781b1e5d2659a2440e3cc4fe2ca274278bc05bcb8860d339e51bb',
    '0x2cc89541c606482ab5736115f3ca3dd5fcbe150dc50042c27b4653b9428a648f',
    '0x2f0c62e073b5ef26c44e1e590c1000b0388a234dc73f9ada563737b631cbe870',
    '0x15c5b95023b2198bad62de0d2b503af4e1febde94896440aba818849981f3145',
    '0x1181497197f03384d142fa00f88cf731185f886e69560e4ec775e531e9fdaead',
    '0x1a6599a0bf4c5dce3dd8419c968727e813e296075f7fba98c32704aa5481103a',
    '0x25f38e7d28648d602b94dd2e3cba2319212035c42a5c5cc528dbea8b34bb2203',
    '0x204da648df5d62c464bd7b4d88cd2eef4fd3866b12b69f7488c71cf61f0c3b47',
    '0x1fea40ab1d91aa5dbe2f9d5d829e53d09efc3e5b64484008f09d44058f24c071',
    '0x134ec9bdeb51bb4adb26a1ac10cbed5f3c381f897f667134657d27cf16cb291f',
    '0x2e95b88f4caa6c93c7ed1c5736a8a202bf4a24a59d8db5fdd028d88d1097bc8f',
    '0x03d5d333b260a382125e88560015f6343b48ec9791aed5af61c95e0b9cff1c77',
    '0x14d520291c9c32e698a1728138d2b1c6cb43ef4841200a4f54c9389301dd62b6',
    '0x2fce45e16df45d46f637456763b5a80f0e36240122dfa5afe74f5dae6f7e7491',
    '0x0edf79f56a49b49a204a696260c6257fddb061867ea9d0f68f915f99e9212b3a',
    '0x1b76df559c5b20d49d3f3c3c25a91d2f6fb457ca947d229f9a6f3e2f9a8ed2d5',
    '0x0f965c23dd5e2aa59a04edd418173273a55ea34c3c03568346b48f4fa84b9372',
    '0x211cc84443fcabbea8f9c5b7395fbc77de19511761413a79bb6713429c319e20',
    '0x1665fe58542013065e8aa459684ed07a2b45a96e20d698099e72b71b0a2dcd39',
    '0x263caed125777c6ead622bab9935677768f573023490e9a5da01efdb0d535ee9',
    '0x061390a981907195af69a139877a7794b0807d7f943dd093c6b23772aea6b5e7',
    '0x13d420c1c07d781c8ad7761a30aa10948f0c1445db5735a17f8b4d213a458f08',
    '0x08c2088aad0ba3b6b194567779a09efd23f039306b2a1fa177bb9495e5645b5f',
    '0x2c5ae8bbe6693a853cf617acb8997459b096f1e23990c59165d2d83ca4d5a70e',
    '0x2686cde4cc3c2718fc98a494691b1090d162d9b6e97d2094e90186e765a0dd3e',
    '0x16bac9eacf126d54956794571e279532db94b38e89fba15ff029357cbb5b252c',
    '0x18ff90d73fce2ccc8ee0133af9d44cf41fd6d5f9236267b2b3ab544ad53812c0',
    '0x1498ad993ec57cc62702bf5d03ec618fa87d408855ffc77efb6245f8f8abd4d3'
  ];
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
  const pm = new wasm.ProvingManager();
  pm.set_relayer('929E7eb6997408C196828773db642D76e79bda93');
  pm.set_recipient('929E7eb6997408C196828773db642D76e79bda93');
  pm.set_curve('Bls381');
  pm.set_leaves(leaves.map((hex) => hexToU8a(hex)));
}
console.log('sleep');
main();
