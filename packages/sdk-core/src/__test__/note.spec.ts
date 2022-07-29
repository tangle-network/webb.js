// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect } from 'chai';

import { Note, NoteGenInput } from '../note.js';

describe.only('Note class', () => {
  it('should test constructor from `NoteGenInput`', async () => {
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

    const note = await Note.generateNote(noteInput);

    expect(note.note.amount).to.deep.equal('1');
    expect(note.note.denomination).to.deep.equal('18');
    expect(note.note.width).to.deep.equal('5');
    expect(note.note.exponentiation).to.deep.equal('5');
    expect(note.note.targetChainId).to.deep.equal('1');
    expect(note.note.targetIdentifyingData).to.deep.equal('1');
    expect(note.note.sourceChainId).to.deep.equal('1');
    expect(note.note.sourceIdentifyingData).to.deep.equal('1');
    expect(note.note.backend).to.deep.equal('Arkworks');
    expect(note.note.hashFunction).to.deep.equal('Poseidon');
    expect(note.note.curve).to.deep.equal('Bn254');
    expect(note.note.tokenSymbol).to.deep.equal('WEBB');
  });

  it('should test serializing and deserializing', async () => {
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

    const note = await Note.generateNote(noteInput);
    const serializedNote = note.serialize();
    const deserializedNote = await Note.deserialize(serializedNote);

    expect(deserializedNote.note.sourceChainId).to.deep.equal('1');
    expect(deserializedNote.note.sourceIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.targetChainId).to.deep.equal('1');
    expect(deserializedNote.note.targetIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.backend).to.deep.equal('Arkworks');
    expect(deserializedNote.note.hashFunction).to.deep.equal('Poseidon');
    expect(deserializedNote.note.curve).to.deep.equal('Bn254');
    expect(deserializedNote.note.tokenSymbol).to.deep.equal('WEBB');
    expect(deserializedNote.note.amount).to.deep.equal('1');
    expect(deserializedNote.note.denomination).to.deep.equal('18');
    expect(deserializedNote.note.width).to.deep.equal('5');
    expect(deserializedNote.note.exponentiation).to.deep.equal('5');
  });

  it('should test vanchor secret destination chain', async () => {
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

    const note = await Note.generateNote(noteInput);
    const targetChainFromSecrets = note.note.secrets.split(':')[0];
    const targetChainBuffer = Buffer.from(targetChainFromSecrets, 'hex');
    const targetChain = targetChainBuffer.readBigUInt64BE();

    expect(targetChain.toString()).to.deep.equal('1');
  });

  it('should fail with circom backend without secrets', async () => {
    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Circom',
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

    try {
      await Note.generateNote(noteInput);
    } catch (e: any) {
      expect(e.code).to.equal(42);
      expect(e.message).to.equal('Circom backend is supported when the secret value is supplied');
    }
  });
  it('should generate a mixer note with circom backend when secrets are passed', async () => {
    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Circom',
      curve: 'Bn254',
      denomination: '18',
      exponentiation: '5',
      hashFunction: 'Poseidon',
      protocol: 'mixer',
      secrets: '339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b',
      sourceChain: '1',
      sourceIdentifyingData: '1',
      targetChain: '1',
      targetIdentifyingData: '1',
      tokenSymbol: 'WEBB',
      version: 'v2',
      width: '5'
    };

    const { note } = await Note.generateNote(noteInput);

    expect(note.backend).to.equal('Circom');
  });

  it('should generate an vanchor note with circom backend when secrets are passed', async () => {
    const noteInput: NoteGenInput = {
      amount: '1000000000000000000',
      backend: 'Circom',
      curve: 'Bn254',
      denomination: '18',
      exponentiation: '5',
      hashFunction: 'Poseidon',
      protocol: 'vanchor',
      secrets: '0000010000007a69:002b977c06e55a6b1fb0552373c9001a2d0601d2c739607954c1c291278b07ca:0033b53cd0cb680239a7b1a671282f30cbcaa9e6fa05c6b1bfd11ef7a1d1a1fa:002b977c06e55a6b1fb0552373c9001a2d0601d2c739607954c1c291278b07ca',
      sourceChain: '1099511659113',
      sourceIdentifyingData: '1',
      targetChain: '1099511659113',
      targetIdentifyingData: '1',
      tokenSymbol: 'DAI',
      version: 'v2',
      width: '5'
    };

    const { note } = await Note.generateNote(noteInput);

    expect(note.backend).to.equal('Circom');
  });

  it('should fail to deserialize invalid protocol', async () => {
    const serialized =
      'webb://' +
      'v2:invalid/' +
      '1:1/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(4);
      expect(e.message).to.equal('Invalid note protocol');
    }
  });

  it('should fail to deserialize invalid version', async () => {
    const serialized =
      'webb://' +
      'v3:vanchor/' +
      '1:1/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(5);
      expect(e.message).to.equal('Invalid note version');
    }
  });

  it('should fail to deserialize invalid source chain id', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      'invalid_source_chain_id:1/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(18);
      expect(e.message).to.equal('Invalid source chain id');
    }
  });

  it('should fail to deserialize invalid target chain id', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:invalid_target_chain_id/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(19);
      expect(e.message).to.equal('Invalid target chain id');
    }
  });

  it('should fail to deserialize invalid note length', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      // + '1:1/' Nullify the source identify data
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Note length has incorrect parts length: 4');
    }
  });

  it('should fail to deserialize anchor invalid secrets (invalid chain id item - too large)', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from :from secrets portion
      '11010101010101100000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid note secrets');
    }
  });

  it('should fail to deserialize anchor invalid secrets (invalid chain id item - too small)', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from :from secrets portion
      '0001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid note secrets');
    }
  });

  it('should fail to deserialize anchor invalid secrets (missing chain id item)', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from :from secrets portion
      'ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });

  it('should fail to deserialize anchor invalid secrets (nullifier item)', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from :from secrets portion
      '0000000000000001:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });

  it('should fail to deserialize anchor invalid secrets (multiple colons)', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      // Remove a secret item and :and leave colon
      '0000000000000001::339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid note secrets');
    }
  });

  it('should fail to deserialize anchor invalid secrets (1 colon)', async () => {
    const serialized =
      'webb://' +
      'v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      // Remove a secret item and also :also remove colon
      '0000000000000001:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });

  it('should deserialized vanchor note', async () => {
    const serialized =
      'webb://v2:vanchor/' +
      '1:1/1:1/' +
      '0000000000000001:0100000000000000000000000000000000000000000000000000000000000000:a5ae2e56bf539da01d46e9f762faf1fa6cf4547822bd1ec720a10aec2fe6651f:fdda3612a8761648547834e50313935409a1faea9eb27bf2574fc7828c332f26/' +
      '?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=WEBB&denom=18&amount=1';

    const { note } = await Note.deserialize(serialized);

    // Trigger the leaf generation to ensure all secrets and there types are correct
    note.getLeafCommitment();

    expect(note.protocol).to.equal('vanchor');
  });

  it('should fail to deserialize vanchor note with secrets less than 5 (Leaf gen failure)', async () => {
    const serialized =
      'webb://v2:vanchor/' +
      '1:1/' +
      '1:1/' +
      '0100000000000000000000000000000000000000000000000000000000000000:c841cfb05415b4fb9872576dc0f7f366cb5cc909e196c53522879a01fa807e0e:4f5cf320dd74031fc6d190e2d17c807828efc03accd6a6c466e09eb4f5aceb13:0002000000000000/' +
      '?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=WEBB&denom=18&amount=1';

    const { note } = await Note.deserialize(serialized);

    try {
      // Trigger the leaf generation to ensure all secrets and there types are correct

      note.getLeafCommitment();
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid secret format for protocol vanchor');
    }

    expect(note.protocol).to.equal('vanchor');
  });

  it('vanchor note generation should Fail for Bls381', async () => {
    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Arkworks',
      curve: 'Bls381',
      denomination: '18',
      exponentiation: '5',
      hashFunction: 'Poseidon',
      index: 5,
      protocol: 'vanchor',
      sourceChain: '1',
      sourceIdentifyingData: '1',
      targetChain: '1',
      targetIdentifyingData: '1',
      tokenSymbol: 'WEBB',
      version: 'v2',
      width: '5'
    };

    try {
      await Note.generateNote(noteInput);
    } catch (e: any) {
      expect(e.code).to.equal(32);
      expect(e.message).to.equal('No VAnchor leaf setup for curve Bls381, exponentiation 5, and width 5');
    }
  });

  it('vanchor should fail with secrets 4 secrets', async () => {
    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Arkworks',
      curve: 'Bn254',
      denomination: '18',
      exponentiation: '5',
      hashFunction: 'Poseidon',
      protocol: 'vanchor',
      secrets:
        '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b',
      sourceChain: '1',
      sourceIdentifyingData: '1',
      targetChain: '1',
      targetIdentifyingData: '1',
      tokenSymbol: 'WEBB',
      version: 'v2',
      width: '5'
    };

    try {
      await Note.generateNote(noteInput);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('VAnchor secrets length should be 4 in length');
    }
  });

  it('should generate vanchor note', async () => {
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
    const note = await Note.generateNote(noteInput);

    const serializedNote = note.serialize();
    const deserializedNote = await Note.deserialize(serializedNote);

    expect(deserializedNote.note.sourceChainId).to.deep.equal('1');
    expect(deserializedNote.note.sourceIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.targetChainId).to.deep.equal('1');
    expect(deserializedNote.note.targetIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.backend).to.deep.equal('Arkworks');
    expect(deserializedNote.note.hashFunction).to.deep.equal('Poseidon');
    expect(deserializedNote.note.curve).to.deep.equal('Bn254');
    expect(deserializedNote.note.tokenSymbol).to.deep.equal('WEBB');
    expect(deserializedNote.note.amount).to.deep.equal('1');
    expect(deserializedNote.note.denomination).to.deep.equal('18');
    expect(deserializedNote.note.width).to.deep.equal('5');
    expect(deserializedNote.note.exponentiation).to.deep.equal('5');
    expect(deserializedNote.note.version).to.deep.equal('v2');
    expect(deserializedNote.note.protocol).to.deep.equal('vanchor');
  });

  it('should update vanchor utxo index successfully', async () => {
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
    // Note generated
    const { note } = await Note.generateNote(noteInput);
    const noteWithoutIndex = note.serialize();

    const miscPartsObj = (note: string): Record<string, string> => {
      return note
        .split('?')[1]
        .split('&')
        .reduce((acc, entry) => {
          const [key, value] = entry.split('=');

          return {
            ...acc,
            [key]: value
          };
        }, {});
    };

    const miscPartsWithoutIndex: any = miscPartsObj(noteWithoutIndex);

    // No index before mutating
    expect(miscPartsWithoutIndex.index).to.deep.equal(undefined);
    note.mutateIndex('512');

    const serializedNote = note.serialize();
    const deserializedNote = await Note.deserialize(serializedNote);
    const miscPartsWitIndex: any = miscPartsObj(serializedNote);

    expect(miscPartsWitIndex.index).to.deep.equal('512');

    expect(deserializedNote.note.sourceChainId).to.deep.equal('1');
    expect(deserializedNote.note.sourceIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.targetChainId).to.deep.equal('1');
    expect(deserializedNote.note.targetIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.backend).to.deep.equal('Arkworks');
    expect(deserializedNote.note.hashFunction).to.deep.equal('Poseidon');
    expect(deserializedNote.note.curve).to.deep.equal('Bn254');
    expect(deserializedNote.note.tokenSymbol).to.deep.equal('WEBB');
    expect(deserializedNote.note.amount).to.deep.equal('1');
    expect(deserializedNote.note.denomination).to.deep.equal('18');
    expect(deserializedNote.note.width).to.deep.equal('5');
    expect(deserializedNote.note.exponentiation).to.deep.equal('5');
    expect(deserializedNote.note.version).to.deep.equal('v2');
    expect(deserializedNote.note.protocol).to.deep.equal('vanchor');
    expect(deserializedNote.note.index).to.deep.equal('512');
  });
});
