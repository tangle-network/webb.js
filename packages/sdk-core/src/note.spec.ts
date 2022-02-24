import { Note } from './note';

describe('Note tests', () => {
  it('should deserialize correctly using Note in sdk-core: ', async () => {
    const note = await Note.deserialize('webb://v2:anchor/1099511627780:1099511627780/0x4e7D4BEe028655F2865d9D147cF7B609c516d39C:0x4e7D4BEe028655F2865d9D147cF7B609c516d39C/010000000004:00defe0ff44373b7c9c892a3fd3c72af100b35b7b319686aac357bb41d52eb2d:00b62b13d3af6d4f585cef8775e0c1bc11f77ff545c468b3bed00024d342815c/?curve=Bn254&width=3&exp=5&hf=Poseidon&backend=Circom&token=webbWETH&denom=18&amount=0.1');
    const noteString = note.serialize();
    const depositNote = await note.toDepositNote();
    expect(depositNote.version).toEqual("v2");
    expect(depositNote.secrets).toEqual("010000000004:00defe0ff44373b7c9c892a3fd3c72af100b35b7b319686aac357bb41d52eb2d:00b62b13d3af6d4f585cef8775e0c1bc11f77ff545c468b3bed00024d342815c")
    expect(noteString).toEqual("webb://v2:anchor/1099511627780:1099511627780/0x4e7D4BEe028655F2865d9D147cF7B609c516d39C:0x4e7D4BEe028655F2865d9D147cF7B609c516d39C/010000000004:00defe0ff44373b7c9c892a3fd3c72af100b35b7b319686aac357bb41d52eb2d:00b62b13d3af6d4f585cef8775e0c1bc11f77ff545c468b3bed00024d342815c/?curve=Bn254&width=3&exp=5&hf=Poseidon&backend=Circom&token=webbWETH&denom=18&amount=0.1");
  });
})