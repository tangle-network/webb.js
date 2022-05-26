// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable camelcase */

// eslint-disable-next-line camelcase
import { JsNoteBuilder, JsUtxo, MTBn254X5, OutputUtxoConfig, setupKeys, verify_js_proof } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { expect } from 'chai';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { ProvingManagerSetupInput, ProvingManagerWrapper } from '../proving/index.js';

function generateVAnchorNote (amount: number, chainId: number, outputChainId: number, index?: number) {
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

const vanchorBn2542_2_2 = setupKeys('vanchor', 'Bn254', 2, 2, 2);
const vanchorBn2542_16_2 = setupKeys('vanchor', 'Bn254', 2, 16, 2);

describe('Proving manager VAnchor', function () {
  this.timeout(120_1000);

  it('should  prove using WASM API for VAnchor with one input note and one index', async () => {
    const keys = vanchorBn2542_2_2;

    const vanchorNote1 = generateVAnchorNote(20, 0, 0, 0);

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = BigInt(0);

    const leaf1 = vanchorNote1.getLeafCommitment();
    const tree = new MTBn254X5([leaf1], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1];

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      calcExtHash (_output: [JsUtxo, JsUtxo]): string {
        return '10101010101010101010';
      },
      chainId: '0',
      indices: [0],
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

  it('should prove using WASM API for VAnchor with two inputs and two indices', async () => {
    const keys = vanchorBn2542_2_2;

    const vanchorNote1 = generateVAnchorNote(10, 0, 0, 0);
    const vanchorNote2 = generateVAnchorNote(10, 0, 0, 1);

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = BigInt(0);

    const leaf1 = vanchorNote1.getLeafCommitment();
    const leaf2 = vanchorNote2.getLeafCommitment();
    const tree = new MTBn254X5([leaf1, leaf2], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1, leaf2];

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      calcExtHash (_output: [JsUtxo, JsUtxo]): string {
        return '10101010101010101010';
      },
      chainId: '0',
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

  it('should prove using WASM API for VAnchor with three inputs amd three indices', async () => {
    const keys = vanchorBn2542_16_2;

    const notes = Array(3)
      .fill(0)
      .map((_, index) => generateVAnchorNote(10, 0, 0, index));

    const publicAmount = 10;
    const outputAmount = String(10 * 1.5 + 5);
    const outputChainId = BigInt(0);
    const leaves = notes.map((note) => note.getLeafCommitment());

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      calcExtHash (_output: [JsUtxo, JsUtxo]): string {
        return '10101010101010101010';
      },
      chainId: '0',
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

  it('should prove using WASM API for VAnchor with 16 inputs and 16 indices', async () => {
    const keys = vanchorBn2542_16_2;

    const notes = Array(16)
      .fill(0)
      .map((_, index) => generateVAnchorNote(10, 0, 0, index));

    const publicAmount = 10;
    const outputAmount = String(10 * 8 + 5);
    const outputChainId = BigInt(0);
    const leaves = notes.map((note) => note.getLeafCommitment());

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      calcExtHash (_output: [JsUtxo, JsUtxo]): string {
        return '10101010101010101010';
      },
      chainId: '0',
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

  it('should fail to prove using WASM API for VAnchor with 16 inputs and 16 indices with invalid amounts', async () => {
    let message = '';

    try {
      const keys = vanchorBn2542_16_2;

      const notes = Array(16)
        .fill(0)
        .map((_, index) => generateVAnchorNote(10, 0, 0, index));

      const publicAmount = 10;
      const outputAmount = String(10 * 80 + 5);
      const outputChainId = BigInt(0);
      const leaves = notes.map((note) => note.getLeafCommitment());
      const tree = new MTBn254X5(leaves, '0');
      const root = `0x${tree.root}`;
      const rootsSet = [hexToU8a(root), hexToU8a(root)];
      const leavesMap: any = {};

      leavesMap[0] = leaves;

      const outputConfig1 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);
      const outputConfig2 = new OutputUtxoConfig(outputAmount, undefined, outputChainId);

      const provingManager = new ProvingManagerWrapper('direct-call');
      const setup: ProvingManagerSetupInput<'vanchor'> = {
        calcExtHash (_output: [JsUtxo, JsUtxo]): string {
          return '10101010101010101010';
        },
        chainId: '0',
        indices: notes.map((_, index) => index),
        inputNotes: notes.map((note) => note.serialize()),
        leavesMap: leavesMap,
        outputConfigs: [outputConfig1, outputConfig2],
        provingKey: keys.pk,
        publicAmount: String(publicAmount),
        roots: rootsSet
      };

      await provingManager.proof('vanchor', setup);
    } catch (e: any) {
      message = e.message;
    }

    expect(message).to.deep.equal('Output amount and input amount  don\'t match input(170) != output(1610)');
  });
});
