// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable camelcase */

// eslint-disable-next-line camelcase
import { JsUtxo, MTBn254X5, setupKeys, verify_js_proof } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { expect } from 'chai';

import { hexToU8a, u8aToHex } from '@polkadot/util';
import { naclEncrypt, randomAsU8a } from '@polkadot/util-crypto';

import { Note } from '../note.js';
import { ArkworksProvingManagerWrapper, ProvingManagerSetupInput } from '../proving/index.js';

async function generateVAnchorNote (amount: number, chainId: number, outputChainId: number, index?: number) {
  const note = await Note.generateNote({
    amount: String(amount),
    backend: 'Arkworks',
    curve: 'Bn254',
    denomination: String(18),
    exponentiation: String(5),
    hashFunction: 'Poseidon',
    index,
    protocol: 'vanchor',
    sourceChain: String(chainId),
    sourceIdentifyingData: '1',
    targetChain: String(outputChainId),
    targetIdentifyingData: '1',
    tokenSymbol: 'WEBB',
    version: 'v2',
    width: String(5)

  });

  return note;
}

const vanchorBn2542_2_2 = setupKeys('vanchor', 'Bn254', 2, 2, 2);
const vanchorBn2542_16_2 = setupKeys('vanchor', 'Bn254', 2, 16, 2);

describe('Proving manager VAnchor', function () {
  this.timeout(120_1000);

  it('should  prove using WASM API for VAnchor with one input note and one index', async () => {
    const keys = vanchorBn2542_2_2;

    const vanchorNote1 = await generateVAnchorNote(20, 0, 0, 0);

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = '0';

    const leaf1 = vanchorNote1.getLeaf();
    const tree = new MTBn254X5([leaf1], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1];

    const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');
    const provingManager = new ArkworksProvingManagerWrapper('direct-call');
    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      indices: [0],
      inputNotes: [vanchorNote1.serialize()],
      leavesMap,
      output: [output1, output2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      relayer: address,
      roots: rootsSet
    };
    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should prove using WASM API for VAnchor with two inputs and two indices', async () => {
    const keys = vanchorBn2542_2_2;

    const vanchorNote1 = await generateVAnchorNote(10, 0, 0, 0);
    const vanchorNote2 = await generateVAnchorNote(10, 0, 0, 1);

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = String(0);

    const leaf1 = vanchorNote1.getLeaf();
    const leaf2 = vanchorNote2.getLeaf();
    const tree = new MTBn254X5([leaf1, leaf2], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1, leaf2];

    const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManagerWrapper('direct-call');
    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      indices: [0, 1],
      inputNotes: [vanchorNote1.serialize(), vanchorNote2.serialize()],
      leavesMap,
      output: [output1, output2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      relayer: address,
      roots: rootsSet
    };
    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should prove using WASM API for VAnchor with three inputs amd three indices', async () => {
    const keys = vanchorBn2542_16_2;

    const notes = await Promise.all(Array(3)
      .fill(0)
      .map((_, index) => generateVAnchorNote(10, 0, 0, index)));

    const publicAmount = 10;
    const outputAmount = String(10 * 1.5 + 5);
    const outputChainId = String(0);
    const leaves = notes.map((note) => note.getLeaf());

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', 16, 2, outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', 16, 2, outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManagerWrapper('direct-call');
    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      indices: notes.map((_, index) => index),
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap,
      output: [output1, output2],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      relayer: address,
      roots: rootsSet
    };

    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should prove using WASM API for VAnchor with 16 inputs and 16 indices', async () => {
    const keys = vanchorBn2542_16_2;

    const notes = await Promise.all(Array(16)
      .fill(0)
      .map((_, index) => generateVAnchorNote(10, 0, 0, index)));

    const publicAmount = 10;
    const outputAmount = String(10 * 8 + 5);
    const outputChainId = String(0);
    const leaves = notes.map((note) => note.getLeaf());

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManagerWrapper('direct-call');

    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      indices: notes.map((_, index) => index),
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap,
      output: [output1, output2],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      relayer: address,
      roots: rootsSet
    };

    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should fail to prove using WASM API for VAnchor with 16 inputs and 16 indices with invalid amounts', async () => {
    let message = '';

    try {
      const keys = vanchorBn2542_16_2;

      const notes = await Promise.all(Array(16)
        .fill(0)
        .map((_, index) => generateVAnchorNote(10, 0, 0, index)));

      const publicAmount = 10;
      const outputAmount = String(10 * 80 + 5);
      const outputChainId = String(0);
      const leaves = notes.map((note) => note.getLeaf());
      const tree = new MTBn254X5(leaves, '0');
      const root = `0x${tree.root}`;
      const rootsSet = [hexToU8a(root), hexToU8a(root)];
      const leavesMap: any = {};

      leavesMap[0] = leaves;

      const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
      const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, outputAmount, outputChainId, undefined);
      const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

      const provingManager = new ArkworksProvingManagerWrapper('direct-call');

      const secret = randomAsU8a();
      const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
      const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

      const setup: ProvingManagerSetupInput<'vanchor'> = {
        chainId: '0',
        encryptedCommitments: [comEnc1, comEnc2],
        extAmount: '0',
        fee: '0',
        indices: notes.map((_, index) => index),
        inputNotes: notes.map((note) => note.serialize()),
        leavesMap,
        output: [output1, output2],

        provingKey: keys.pk,
        publicAmount: String(publicAmount),
        recipient: address,
        relayer: address,
        roots: rootsSet
      };

      await provingManager.prove('vanchor', setup);
    } catch (e: any) {
      message = e.message;
    }

    expect(message).to.deep.equal('Output amount and input amount  don\'t match input(170) != output(1610)');
  });
});
