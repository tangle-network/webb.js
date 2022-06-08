import { expect } from 'chai';

import { u8aToHex } from '@polkadot/util';

import { WasmUtxo } from '../wasm-utxo.js';

describe.only('WasmUtxo Class', () => {
  it('should construct with params', async function () {
    const wasmutxo = await WasmUtxo.new('Bn254', 'Arkworks', 2, 2, '0', '1', '1');
    const nullifier = wasmutxo.nullifier;
    const commitment = wasmutxo.commitment;
    const blinding = wasmutxo.blinding;
    const secretKey = wasmutxo.secret_key;
    const amount = wasmutxo.amount;
    const index = wasmutxo.index;
    const serialziedUtxo = wasmutxo.serialize();
    const deserializedWasmUtxo = await WasmUtxo.deserialize(serialziedUtxo);
    const nullifier2 = deserializedWasmUtxo.nullifier;
    const commitment2 = deserializedWasmUtxo.commitment;
    const blinding2 = deserializedWasmUtxo.blinding;
    const secretKey2 = deserializedWasmUtxo.secret_key;
    const amount2 = deserializedWasmUtxo.amount;
    const index2 = deserializedWasmUtxo.index;

    expect(nullifier2).to.deep.equal(nullifier);
    expect(secretKey2).to.deep.equal(secretKey);
    expect(blinding2).to.deep.equal(blinding);
    expect(amount2).to.deep.equal(amount);
    expect(index2).to.deep.equal(index);
    expect(u8aToHex(commitment2)).to.deep.equal(u8aToHex(commitment));
  });
  it('should deserialize and serialize to the smae value', async function () {
    const serializedInput = [
      'Bn254',
      'Arkworks',
      '2',
      '2',
      '0',
      '1',
      '1',
      '56fddd69bb4f989fcf3cb4e0b94ac887379e0f16b36d4d287c1e6059595b4118',
      '4514d5386c01bc197292954194c807cbabdb43bc40404e8d0cd6a2c097871a06'
    ].join('&');
    const deserialized = await WasmUtxo.deserialize(serializedInput);
    const serializedOutput = deserialized.serialize();

    expect(serializedInput).to.deep.equal(serializedOutput);
  });
});
