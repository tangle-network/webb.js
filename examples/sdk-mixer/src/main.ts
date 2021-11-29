// @ts-ignore
import Worker from './mixer.worker.ts';
import { ProvingManger } from '@webb-tools/sdk-core';
import { hexToU8a, u8aToHex, stringToU8a, u8aConcat } from '@polkadot/util';
import { Note } from '@webb-tools/sdk-mixer';
import { NoteGenInput } from '../../../packages/sdk-mixer/build';

async function generate_leaf() {
  const noteInput: NoteGenInput = {
    prefix: 'webb.mix',
    version: 'v1',
    exponentiation: '5',
    width: '3',
    backend: 'Arkworks',
    hashFunction: 'Poseidon',
    curve: 'Bn254',
    denomination: '18',

    amount: '1',
    chain: '1',
    sourceChain: '1',
    tokenSymbol: 'EDG'
  };
  const depositNote = await Note.generateNote(noteInput);
  const leaf = depositNote.getLeaf();
  console.log(u8aToHex(leaf));
}

async function main() {
  const n = await Note.deserialize(
    'webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:EDG:18:1:5:5:933bd84d0b7ed9fa9b216797f787d16898c0d489c7461dc3ff8fdcd34453362bb6a1379362205f3bf2a05ae2bfa7023ad01997db8acc404ecc81293f5de02022bcf08f6d2576af2577cd61b2d2aa0d94c2814084d4c3913a4ee4beb76ba9171c'
  );
  console.log(n.note.backend);
  console.log(n.note.curve);
  console.log(n.note.denomination);
  let leaves = [
    '0x1111111000000000000000000000000000000000000000000000000000000000',
    '0x1111111000000000000000000000000000000000000000000000000000000100',
    '0x37b7c0b04e6d08f43be1dc6a4080afca5c44c251df473e336fd9f788844b861e',
    '0x6d9c60a2a9e2b101f86e66382e6b23aec8eb568ec109ba2da985ab433151cd11',
    '0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000000',
    '0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000000',
    '0x661fee59878756175f4c2af109f81cebeda980c1464e981becd19d3d99fab018',
    '0x3bdae75dd81ae9869efa7fb2bc99cdb2320d60d26b7a3591f2d8f13b9b148d1e',
    '0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000100',
    '0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000100',
    '0x149ae0c63caebd66f3d28a7f4bf3c5f22da56c2b6a37648561141ecb7c2abf15',
    '0x6fa96ad4629490bd126da30c1df65ad37256afaaa0d9fd1856d8c755f377940e',
    '0x30c9533af24d0feb8c44bdaece49e79886720d3d43c10a8b1b14ac9071c8391d',
    '0x12dba9517079c0a79fcbdfbf77df8744f4edddf103f72f33787ef19cedf67222',
    '0x573e3cd36487821cc29d6481e5e7465902d086d11ab95a182834dbb91e93c110'
  ];
  const pm = new ProvingManger(new Worker());
  const proof = await pm.proof({
    relayer: '644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129',
    recipient: '644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129',
    note: 'webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:WEBB:18:10:5:5:a1feeba98193583d3fb0304b456676976ff379ef54f3749419741d9b6eec2b20e059e20847ba94f6b78fcacb2e6b8b6dd1f40e65c6b0d15eb3b40a4fc600431797c787b40e6ead35527a299786411a19731ba909c3ab2e242b4abefb023f072a',
    leaves: leaves.map((a) => hexToU8a(a))
  });
  console.log(proof);
  console.log(proof.root);
  console.log(proof.proof);
  console.log(proof.nullifier_hash);
}

main().then((a) => {
  console.log(a);
});
