// @ts-ignore
import Worker from "./mixer.worker.ts";
import { ProvingManager } from "@webb-tools/sdk-core";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { Note } from "@webb-tools/sdk-core";
async function generateLeaf() {
  const depositNote = await Note.deserialize("webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:WEBB:18:10:5:5:a1feeba98193583d3fb0304b456676976ff379ef54f3749419741d9b6eec2b20e059e20847ba94f6b78fcacb2e6b8b6dd1f40e65c6b0d15eb3b40a4fc600431797c787b40e6ead35527a299786411a19731ba909c3ab2e242b4abefb023f072a");
  console.log(depositNote.note.curve, depositNote.note.width, depositNote.note.exponentiation, depositNote.note.denomination, depositNote.note.amount);
  const noteInput = {
    prefix: "webb.mix",
    version: "v1",
    exponentiation: "5",
    width: "3",
    backend: "Arkworks",
    hashFunction: "Poseidon",
    curve: "Bn254",
    denomination: "5",

    amount: "1",
    chain: "1",
    sourceChain: "1",
    tokenSymbol: "WEBB"
  };
  const note = await Note.generateNote(noteInput);
  console.log(note.serialize());
  const leaf = note.getLeaf();
  console.log(u8aToHex(leaf));
}

async function main() {
  const n = await Note.deserialize(
    "webb.mixer:v1:15:15:Arkworks:Bn254:Poseidon:WEBB:12:10:5:5:f840b49ab7d1b7472d1798abfb1b8d0e1c6d6a671d9bf88b066a9e6c84386607452e8ab1565f2445bb80bc349329c65cad265331c766d3f5a2ad21e3e6218708"
  );
  console.log(n.note.backend);
  console.log(n.note.curve);
  console.log(n.note.denomination);
  console.log(n.note.hashFunction);
  let leaves = [
    "0x1111111000000000000000000000000000000000000000000000000000000000",
    "0x1111111000000000000000000000000000000000000000000000000000000100",
    "0x37b7c0b04e6d08f43be1dc6a4080afca5c44c251df473e336fd9f788844b861e",
    "0x6d9c60a2a9e2b101f86e66382e6b23aec8eb568ec109ba2da985ab433151cd11",
    "0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000000",
    "0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000000",
    "0x661fee59878756175f4c2af109f81cebeda980c1464e981becd19d3d99fab018",
    "0x3bdae75dd81ae9869efa7fb2bc99cdb2320d60d26b7a3591f2d8f13b9b148d1e",
    "0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000100",
    "0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000100",
    "0x149ae0c63caebd66f3d28a7f4bf3c5f22da56c2b6a37648561141ecb7c2abf15",
    "0x6fa96ad4629490bd126da30c1df65ad37256afaaa0d9fd1856d8c755f377940e",
    "0x30c9533af24d0feb8c44bdaece49e79886720d3d43c10a8b1b14ac9071c8391d",
    "0x12dba9517079c0a79fcbdfbf77df8744f4edddf103f72f33787ef19cedf67222",
    "0x573e3cd36487821cc29d6481e5e7465902d086d11ab95a182834dbb91e93c110"
  ];
  const pm = new ProvingManager(new Worker());
  const proof = await pm.proof({
    "note": "webb.anchor:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717",
    "leafIndex": 0,
    "recipient": "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129",
    "relayer": "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129",
    leaves: leaves.map((a) => hexToU8a(a)),
    refund: 1,
    fee: 1,
    provingKey: new Uint8Array() // TODO fetch from IPFS
  });
  console.log(proof);
  console.log(proof.root);
  console.log(proof.proof);
  console.log(proof.nullifier_hash);
}

// generateLeaf()

main().then((a) => {
  console.log(a);
}).catch(e =>{
  console.log(e);
});

