import { expect } from 'chai';

import { u8aToHex } from '@polkadot/util';

import { CircomUtxo } from '../index.js';
import { Keypair } from '../keypair.js';
import { Utxo } from '../utxo.js';

describe('Utxo Class', () => {
  it('should construct with params', async function () {
    const utxo = await Utxo.generateUtxo({
      amount: '1',
      backend: 'Arkworks',
      chainId: '1',
      curve: 'Bn254',
      index: '0'
    });
    const nullifier = utxo.nullifier;
    const commitment = utxo.commitment;
    const blinding = utxo.blinding;
    const secretKey = utxo.secret_key;
    const amount = utxo.amount;
    const index = utxo.index;
    const serializedUtxo = utxo.serialize();
    const deserializedUtxo = await Utxo.deserialize(serializedUtxo);
    const nullifier2 = deserializedUtxo.nullifier;
    const commitment2 = deserializedUtxo.commitment;
    const blinding2 = deserializedUtxo.blinding;
    const secretKey2 = deserializedUtxo.secret_key;
    const amount2 = deserializedUtxo.amount;
    const index2 = deserializedUtxo.index;

    expect(nullifier2).to.deep.equal(nullifier);
    expect(secretKey2).to.deep.equal(secretKey);
    expect(blinding2).to.deep.equal(blinding);
    expect(amount2).to.deep.equal(amount);
    expect(index2).to.deep.equal(index);
    expect(u8aToHex(commitment2)).to.deep.equal(u8aToHex(commitment));
  });

  it('should deserialize and serialize to the same value', async function () {
    const serializedInput = [
      'Bn254',
      'Arkworks',
      '0',
      '1',
      '1',
      '56fddd69bb4f989fcf3cb4e0b94ac887379e0f16b36d4d287c1e6059595b4118',
      '4514d5386c01bc197292954194c807cbabdb43bc40404e8d0cd6a2c097871a06'
    ].join('&');
    const deserialized = await Utxo.deserialize(serializedInput);
    const serializedOutput = deserialized.serialize();

    expect(serializedInput).to.deep.equal(serializedOutput);
  });

  it('should deserialize and serialize a utxo which does not have an index', async function () {
    const serializedInput = 'Bn254&Arkworks&10000000000000&2199023256632&None&1b44b30ac48be4b3448dc7ff2c2d4caa7bd43c61e348990717bd879005443e07&1cea7673e0c7c60df3b8ed4fb108bf38f04a00657e6219b1c2709a3d32e2ee00';

    const deserialized = await Utxo.deserialize(serializedInput);
    const serializedOutput = deserialized.serialize();

    expect(serializedInput).to.deep.equal(serializedOutput);
  });

  it('should generate a utxo with circom backend', async function () {
    const utxo = await CircomUtxo.generateUtxo({
      amount: '1',
      backend: 'Circom',
      chainId: '1',
      curve: 'Bn254',
      index: '0'
    });

    expect(utxo.amount).to.deep.equal('1');
  });

  it('Check valid encryption length', async function () {
    const kp = new Keypair();

    const enc = Keypair.encryptWithKey(kp.getEncryptionKey()!, 'jumbo');

    try {
      await CircomUtxo.decrypt(kp, enc);
    } catch (ex: any) {
      expect(ex.message).to.contain('malformed utxo encryption');
    }
  });
});
