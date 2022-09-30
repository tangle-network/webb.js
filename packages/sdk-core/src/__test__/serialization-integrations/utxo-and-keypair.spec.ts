import { expect } from 'chai';

import { CircomUtxo } from '../../index.js';
import { Keypair } from '../../keypair.js';

describe('Utxo and Keypair serialization integrations', () => {
  it.only('CircomUtxo with privateKey Keypair', async function () {
    const keypair = new Keypair();

    const utxo = await CircomUtxo.generateUtxo({
      amount: '1',
      backend: 'Circom',
      chainId: '1',
      curve: 'Bn254',
      index: '0',
      keypair
    });

    const nullifierBefore = utxo.nullifier;

    const utxoEncryption = utxo.encrypt();
    const utxoDecrypted = await CircomUtxo.decrypt(keypair, utxoEncryption);
    const utxoString = utxo.serialize();
    const recreatedUtxo = await CircomUtxo.deserialize(utxoString);
    const recreatedUtxoString = recreatedUtxo.serialize();
    const recreatedUtxoEncryption = recreatedUtxo.encrypt();
    const recreatedUtxoDecrypted = await CircomUtxo.decrypt(keypair, recreatedUtxoEncryption);

    const nullifierAfter = recreatedUtxoDecrypted.nullifier;

    expect(utxoString).to.deep.equal(recreatedUtxoString);
    expect(utxoString).to.deep.equal(utxoDecrypted.serialize());
    expect(utxoDecrypted).to.deep.equal(recreatedUtxoDecrypted);
    expect(nullifierBefore).to.deep.eq(nullifierAfter);
  });

  it('CircomUtxo with only pubkey data', async function () {
    // Suppose public data has been taken from some registry
    const testPubkey = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const keypair = Keypair.fromString(testPubkey);

    const utxo = await CircomUtxo.generateUtxo({
      amount: '1',
      backend: 'Circom',
      chainId: '1',
      curve: 'Bn254',
      index: '0',
      keypair
    });

    // Should be able to retrieve the utxo commitment without issue
    const commitmentBefore = utxo.commitment;

    const utxoString = utxo.serialize();
    const recreatedUtxo = await CircomUtxo.deserialize(utxoString);

    const commitmentAfter = recreatedUtxo.commitment;

    expect(commitmentBefore).to.deep.equal(commitmentAfter);
  });

  it('CircomUtxo with public key and encryption key', async function () {
    // Create a keypair for validation purposes
    const privKeypair = new Keypair();

    const testPubkey = privKeypair.getPubKey();
    const testEncryptionKey = privKeypair.getEncryptionKey()!;

    const keypair = Keypair.fromString(testPubkey + testEncryptionKey.slice(2));

    const utxo = await CircomUtxo.generateUtxo({
      amount: '1',
      backend: 'Circom',
      chainId: '1',
      curve: 'Bn254',
      index: '0',
      keypair
    });

    const utxoString = utxo.serialize();
    const recreatedUtxo = await CircomUtxo.deserialize(utxoString);
    const utxoEncryptionAfter = recreatedUtxo.encrypt();

    const privkeyDecryptedUtxo = await CircomUtxo.decrypt(privKeypair, utxoEncryptionAfter);

    expect(utxo.serialize()).to.not.deep.equal(privkeyDecryptedUtxo.serialize());
  });
});
