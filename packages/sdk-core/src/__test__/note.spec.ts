// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect } from 'chai';

import { Note, NoteGenInput } from '../note.js';

describe('Note class', () => {
  it.only('should test constructor from `NoteGenInput`', async () => {

    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Circom',
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

    const note = await Note.generateNote(noteInput);

    expect(note.note.amount).to.deep.equal('1');
    expect(note.note.denomination).to.deep.equal('18');
    expect(note.note.width).to.deep.equal('4');
    expect(note.note.exponentiation).to.deep.equal('5');
    expect(note.note.targetChainId).to.deep.equal('1');
    expect(note.note.targetIdentifyingData).to.deep.equal('1');
    expect(note.note.sourceChainId).to.deep.equal('1');
    expect(note.note.sourceIdentifyingData).to.deep.equal('1');
    expect(note.note.backend).to.deep.equal('Circom');
    expect(note.note.hashFunction).to.deep.equal('Poseidon');
    expect(note.note.curve).to.deep.equal('Bn254');
    expect(note.note.tokenSymbol).to.deep.equal('WEBB');

  });

  it.only('should test serializing and deserializing', async () => {
    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Circom',
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

    const note = await Note.generateNote(noteInput);
    const serializedNote = note.serialize();
    const deserializedNote = await Note.deserialize(serializedNote);

    expect(deserializedNote.note.sourceChainId).to.deep.equal('1');
    expect(deserializedNote.note.sourceIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.targetChainId).to.deep.equal('1');
    expect(deserializedNote.note.targetIdentifyingData).to.deep.equal('1');
    expect(deserializedNote.note.backend).to.deep.equal('Circom');
    expect(deserializedNote.note.hashFunction).to.deep.equal('Poseidon');
    expect(deserializedNote.note.curve).to.deep.equal('Bn254');
    expect(deserializedNote.note.tokenSymbol).to.deep.equal('WEBB');
    expect(deserializedNote.note.amount).to.deep.equal('1');
    expect(deserializedNote.note.denomination).to.deep.equal('18');
    expect(deserializedNote.note.width).to.deep.equal('4');
    expect(deserializedNote.note.exponentiation).to.deep.equal('5');
  });

  it.only('should test anchor secrets chain', async () => {
    const noteInput: NoteGenInput = {
      amount: '1',
      backend: 'Circom',
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

    const note = await Note.generateNote(noteInput);
    const targetChainFromSecrets = note.note.secrets.split(':')[0];
    const targetChainBuffer = Buffer.from(targetChainFromSecrets, 'hex');
    const targetChain = targetChainBuffer.readBigUInt64BE();

    expect(targetChain.toString()).to.deep.equal('1');
  });

  it.only('should fail to deserialize invalid protocol', async () => {
    const serialized = 'webb://' +
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

  it.only('should fail to deserialize invalid version', async () => {
    const serialized = 'webb://' +
      'v3:anchor/' +
      '1:1/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(5);
      expect(e.message).to.equal('Invalid note version');
    }
  });

  it.only('should fail to deserialize invalid source chain id', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      'invalid_source_chain_id:1/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(18);
      expect(e.message).to.equal('Invalid source chain id');
    }
  });

  it.only('should fail to deserialize invalid target chain id', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:invalid_target_chain_id/' +
      '1:1/' +
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(19);
      expect(e.message).to.equal('Invalid target chain id');
    }
  });

  it.only('should fail to deserialize invalid note length', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      // + '1:1/' Nullify the source identify data
      '0000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });

  it.only('should fail to deserialize anchor invalid secrets (invalid chain id item - too large)', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from secrets portion
      '11010101010101100000000000000001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid note secrets');
    }
  });

  it.only('should fail to deserialize anchor invalid secrets (invalid chain id item - too small)', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from secrets portion
      '0001:ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid note secrets');
    }
  });

  it.only('should fail to deserialize anchor invalid secrets (missing chain id item)', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from secrets portion
      'ae6c3f92db70334231435b03ca139970e2eeff43860171b9f20a0de4b423741e:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });

  it.only('should fail to deserialize anchor invalid secrets (nullifier item)', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      '1:1/' +
      // Get rid of target chain ID from secrets portion
      '0000000000000001:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });

  it.only('should fail to deserialize anchor invalid secrets (multiple colons)', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      '1:1/' +
      // Remove a secret item and leave colon
      '0000000000000001::339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(8);
      expect(e.message).to.equal('Invalid note secrets');
    }
  });

  it.only('should fail to deserialize anchor invalid secrets (1 colon)', async () => {
    const serialized = 'webb://' +
      'v2:anchor/' +
      '1:1/' +
      '1:1/' +
      // Remove a secret item and also remove colon
      '0000000000000001:339e6c9b0a571e612dbcf60e2c20fc58b4e037f00e9384f0f2c872feea91802b/' +
      '?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Circom&token=WEBB&denom=18&amount=1';

    try {
      await Note.deserialize(serialized);
    } catch (e: any) {
      expect(e.code).to.equal(3);
      expect(e.message).to.equal('Invalid note length');
    }
  });
});
