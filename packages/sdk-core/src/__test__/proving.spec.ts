// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line camelcase
import { JsNoteBuilder, MTBn254X5, OutputUtxoConfig, setupKeys, verify_js_proof } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { expect } from 'chai';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { ProvingManagerSetupInput, ProvingManagerWrapper } from '../proving/index.js';

function generateVAnchorNote (
  amount: number,
  chainId: number,
  outputChainId: number,
  index?: number
) {
  const noteBuilder = new JsNoteBuilder();

  noteBuilder.protocol('vanchor');
  noteBuilder.version('v2');
  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');

  noteBuilder.sourceChainId(String(chainId));
  noteBuilder.targetChainId(String(outputChainId));
  noteBuilder.width(String(5));
  noteBuilder.exponentiation(String(5));
  noteBuilder.denomination(String(18));
  noteBuilder.amount(String(amount));
  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.targetIdentifyingData('');
  noteBuilder.sourceIdentifyingData('');
  const note = noteBuilder.build();

  if (index !== undefined) {
    note.mutateIndex(String(index));
  }

  return note;
}

describe('Proving manager VAnchor', function () {
  this.timeout(720_000);

  it('Should proof js for VAnchor with one inputs', async () => {
    const keys = setupKeys('vanchor');
    const vanchorNote1 = generateVAnchorNote(20, 0, 0, 0);

    console.log('===> Generated vanchor notes');

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = BigInt(0);

    const leaf1 = vanchorNote1.getLeafCommitment();

    console.log('===> Tree setup with leaves');

    const tree = new MTBn254X5([leaf1], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1];
    const externalDataHash = '10101010101010101010';

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      externalDataHash,
      indices: [0, 0],
      inputNotes: [vanchorNote1.serialize()],
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      roots: rootsSet

    };

    const data = await provingManager.proof('vanchor', setup);

    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('Should proof js for VAnchor with two inputs', async () => {
    const keys = setupKeys('vanchor');
    const vanchorNote1 = generateVAnchorNote(10, 0, 0, 0);
    const vanchorNote2 = generateVAnchorNote(10, 0, 0, 1);

    console.log('===> Generated vanchor notes');

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = BigInt(0);

    const leaf1 = vanchorNote1.getLeafCommitment();
    const leaf2 = vanchorNote2.getLeafCommitment();

    console.log('===> Tree setup with leaves');

    const tree = new MTBn254X5([leaf1, leaf2], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1, leaf2];
    const externalDataHash = '10101010101010101010';

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      externalDataHash,
      indices: [0, 1],
      inputNotes: [vanchorNote1.serialize(), vanchorNote2.serialize()],
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      roots: rootsSet

    };

    const data = await provingManager.proof('vanchor', setup);

    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('Should proof js for VAnchor with three inputs', async () => {
    console.log('===> Generating keys for vanchor');
    const keys = setupKeys('vanchor');

    console.log('===> Keys are generated');
    const vanchorNote1 = generateVAnchorNote(10, 0, 0, 0);
    const vanchorNote2 = generateVAnchorNote(10, 0, 0, 1);
    const vanchorNote3 = generateVAnchorNote(10, 0, 0, 2);

    console.log('===> Generated vanchor notes');

    const publicAmount = 0;
    const outputAmount = String(15);
    const outputChainId = BigInt(0);

    const leaf1 = vanchorNote1.getLeafCommitment();
    const leaf2 = vanchorNote2.getLeafCommitment();
    const leaf3 = vanchorNote2.getLeafCommitment();

    console.log('===> Tree setup with leaves');

    const tree = new MTBn254X5([leaf1, leaf2, leaf3], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1, leaf2, leaf3];
    const externalDataHash = '10101010101010101010';

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      externalDataHash,
      indices: [0, 1, 2],
      inputNotes: [vanchorNote1.serialize(), vanchorNote2.serialize(), vanchorNote3.serialize()],
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      roots: rootsSet

    };

    const data = await provingManager.proof('vanchor', setup);

    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('Should proof js for VAnchor with 16 inputs', async () => {
    const keys = setupKeys('vanchor');

    const notes = Array(16).fill(0).map((_, index) => generateVAnchorNote(10, 0, 0, index));

    console.log('===> Generated vanchor notes');

    const publicAmount = 0;
    const outputAmount = String(10 * 80);
    const outputChainId = BigInt(0);
    const leaves = notes.map((note) => note.getLeafCommitment());

    console.log('===> Tree setup with leaves');

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;
    const externalDataHash = '10101010101010101010';

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      externalDataHash,
      indices: notes.map((_, index) => index),
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      roots: rootsSet

    };

    const data = await provingManager.proof('vanchor', setup);

    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });
});
