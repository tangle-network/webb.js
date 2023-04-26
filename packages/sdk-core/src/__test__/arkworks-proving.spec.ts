// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable camelcase */

// eslint-disable-next-line camelcase
import { ProvingManagerSetupInput, Utxo } from '@webb-tools/sdk-core/index.js';
import { JsUtxo, MTBn254X5, verify_js_proof } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

import { hexToU8a, u8aToHex } from '@polkadot/util';
import { naclEncrypt, randomAsU8a } from '@polkadot/util-crypto';

import { Keypair } from '../keypair.js';
import { ArkworksProvingManager } from '../proving/index.js';
import { generateArkworksVAnchorNote } from './utils.js';

async function ensureIndicies (utxos: Utxo[], leaves: Uint8Array[]) {
  const leavesHex = leaves.map((l) => u8aToHex(l));

  for (const utxo of utxos) {
    const leaf = u8aToHex(utxo.commitment);
    const index = utxo.index;

    if (index === undefined) {
      throw new Error('Utxo index not defined');
    }

    const leafOfTree = leavesHex[index];

    if (leafOfTree !== leaf) {
      throw new Error(`${index} leaf=${leaf} don't match tree leaf ${leafOfTree}`);
    }
  }
}

function getKeys_2_2 () {
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-2-2',
    'proving_key_uncompressed.bin'
  );

  const vkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-2-2',
    'verifying_key_uncompressed.bin'
  );
  const pk_hex = fs.readFileSync(pkPath).toString('hex');
  const pk = hexToU8a(pk_hex);
  const vk_hex = fs.readFileSync(vkPath).toString('hex');
  const vk = hexToU8a(vk_hex);

  return {
    pk,
    vk
  };
}

function getKeys_16_2 () {
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-16-2',
    'proving_key_uncompressed.bin'
  );

  const vkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-16-2',
    'verifying_key_uncompressed.bin'
  );
  const pk_hex = fs.readFileSync(pkPath).toString('hex');
  const pk = hexToU8a(pk_hex);
  const vk_hex = fs.readFileSync(vkPath).toString('hex');
  const vk = hexToU8a(vk_hex);

  return {
    pk,
    vk
  };
}

const vanchorBn2542_2_2 = getKeys_2_2();
const vanchorBn2542_16_2 = getKeys_16_2();

describe('Arkworks Proving manager VAnchor', function () {
  this.timeout(120_1000);

  it('should prove using WASM API for VAnchor with one input utxo and one index', async () => {
    const keys = vanchorBn2542_2_2;
    const vanchorUtxo = await Utxo.generateUtxo({
      amount: '20',
      backend: 'Arkworks',
      chainId: '0',
      curve: 'Bn254',
      index: '0',
      originChainId: '0'
    });

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = '0';

    const leaf1 = vanchorUtxo.commitment;
    const tree = new MTBn254X5([leaf1], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1];

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');
    const provingManager = new ArkworksProvingManager(null);
    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos: [vanchorUtxo],
      leafIds: [{ index: 0, typedChainId: 0 }],
      leavesMap,
      output: [new Utxo((output1)), new Utxo(output2)],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };
    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should prove using WASM API for VAnchor with two inputs and two indices', async () => {
    const keys = vanchorBn2542_2_2;
    const utxo1 = await Utxo.generateUtxo({
      amount: '10',
      backend: 'Arkworks',
      chainId: '0',
      curve: 'Bn254',
      index: '0',
      originChainId: '0'
    });
    const utxo2 = await Utxo.generateUtxo({
      amount: '10',
      backend: 'Arkworks',
      chainId: '0',
      curve: 'Bn254',
      index: '1',
      originChainId: '0'
    });

    const publicAmount = 10;
    const outputAmount = String(15);
    const outputChainId = String(0);

    const leaf1 = utxo1.commitment;
    const leaf2 = utxo2.commitment;
    const tree = new MTBn254X5([leaf1, leaf2], '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = [leaf1, leaf2];

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManager(null);
    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos: [utxo1, utxo2],
      leafIds: [{ index: 0, typedChainId: 0 }, { index: 1, typedChainId: 0 }],
      leavesMap,
      output: [new Utxo(output1), new Utxo(output2)],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };
    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should prove using WASM API for VAnchor with three inputs amd three indices', async () => {
    const keys = vanchorBn2542_16_2;

    const inputUtxos = await Promise.all(Array(3)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: index.toString(),
          originChainId: '0'
        });

        return utxo;
      }));

    const publicAmount = 10;
    const outputAmount = String(10 * 1.5 + 5);
    const outputChainId = String(0);
    const leaves = inputUtxos.map((utxo) => utxo.commitment);

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManager(null);
    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos,
      leafIds: [...inputUtxos.map((utxo) => {
        return { index: utxo.index!, typedChainId: Number(utxo.chainId) };
      })],
      leavesMap,
      output: [new Utxo(output1), new Utxo(output2)],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };

    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should prove using WASM API for VAnchor with 16 inputs and 16 indices', async () => {
    const keys = vanchorBn2542_16_2;

    const utxos = await Promise.all(Array(16)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: index.toString(),
          originChainId: '0'
        });

        return utxo;
      }));
    const publicAmount = 10;
    const outputAmount = String(10 * 8 + 5);
    const outputChainId = String(0);
    const leaves = utxos.map((utxo) => utxo.commitment);

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManager(null);

    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos: utxos,
      leafIds: [...utxos.map((utxo) => {
        return { index: utxo.index!, typedChainId: Number(utxo.chainId) };
      })],
      leavesMap,
      output: [new Utxo(output1), new Utxo(output2)],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };

    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });

  it('should fail to prove using WASM API for VAnchor with 16 inputs and 16 indices with invalid amounts', async () => {
    let message = '';

    try {
      const keys = vanchorBn2542_16_2;
      const inputKeypair = new Keypair();

      const utxos = await Promise.all(Array(16)
        .fill(0)
        .map(async (_, index) => {
          const utxo = await Utxo.generateUtxo({
            amount: '10',
            backend: 'Arkworks',
            chainId: '0',
            curve: 'Bn254',
            index: index.toString(),
            keypair: inputKeypair,
            originChainId: '0'
          });

          return utxo;
        }));
      const publicAmount = 10;
      const outputAmount = String(10 * 80 + 5);
      const outputChainId = String(0);
      const leaves = utxos.map((utxos) => utxos.commitment);
      const tree = new MTBn254X5(leaves, '0');
      const root = `0x${tree.root}`;
      const rootsSet = [hexToU8a(root), hexToU8a(root)];
      const leavesMap: any = {};

      leavesMap[0] = leaves;

      const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined, hexToU8a(inputKeypair.getPubKey()));
      const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined, hexToU8a(inputKeypair.getPubKey()));
      const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

      const provingManager = new ArkworksProvingManager(null);

      const secret = randomAsU8a();
      const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
      const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

      const setup: ProvingManagerSetupInput<'vanchor'> = {
        chainId: '0',
        encryptedCommitments: [comEnc1, comEnc2],
        extAmount: '0',
        fee: '0',
        inputUtxos: utxos,
        leafIds: [...utxos.map((utxo) => {
          return { index: utxo.index!, typedChainId: Number(utxo.chainId) };
        })],
        leavesMap,
        output: [new Utxo(output1), new Utxo(output2)],
        provingKey: keys.pk,
        publicAmount: String(publicAmount),
        recipient: address,
        refund: '0',
        relayer: address,
        roots: rootsSet,
        token: address
      };

      await provingManager.prove('vanchor', setup);
    } catch (e: any) {
      message = e.message;
    }

    expect(message).to.deep.equal('Output amount and input amount don\'t match input(170) != output(1610)');
  });

  it('should prove a single utxo commitment is in a tree', async () => {
    const keys = vanchorBn2542_2_2;
    // Previous commitment
    const OlderNotes = await Promise.all(Array(16)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: index.toString(),
          originChainId: '0'
        });

        const note = await generateArkworksVAnchorNote(utxo);

        return note;
      }));
    const publicAmount = 10;
    const depositAmount = 10;
    const outputAmount = String(depositAmount + publicAmount);
    const outputChainId = String(0);
    const leaves = OlderNotes.map((note) => note.getLeaf());
    const depositedUtxo = await Utxo.generateUtxo({
      amount: depositAmount.toString(),
      backend: 'Arkworks',
      chainId: '0',
      curve: 'Bn254',
      index: OlderNotes.length.toString(),
      originChainId: '0'
    });

    // insert the leaf
    leaves.push(depositedUtxo.commitment);
    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    // TODO: Use default root for other place holders
    const rootsSet = [hexToU8a(root), hexToU8a('0x1f15585f8947e378bcf8bd918716799da909acdb944c57150b1eb4565fda8aa0')];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId);
    const output2 = new JsUtxo('Bn254', 'Arkworks', '0', outputChainId);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManager(null);

    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos: [depositedUtxo],
      leafIds: [{ index: depositedUtxo.index!, typedChainId: Number(depositedUtxo.chainId) }],
      leavesMap,
      output: [new Utxo(output1), new Utxo(output2)],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };

    const data = await provingManager.prove<'vanchor'>('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.equal(true);
  });

  it('should prove with pre existing leaves', async () => {
    const keys = vanchorBn2542_16_2;
    const preExistingUtxos = await Promise.all(Array(16)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: index.toString(),
          originChainId: '0'
        });

        return utxo;
      }));
    const utxos = await Promise.all(Array(16)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: (index + 16).toString(),
          originChainId: '0'
        });

        return utxo;
      }));
    const publicAmount = 10;
    const outputAmount = String(10 * 8 + 5);
    const outputChainId = String(0);
    const leaves = [...preExistingUtxos, ...utxos].map((utxo) => utxo.commitment);

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined);
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManager(null);

    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    await ensureIndicies(utxos, leaves);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos: utxos,
      leafIds: [...utxos.map((utxo) => {
        return { index: utxo.index!, typedChainId: Number(utxo.chainId) };
      })],
      leavesMap,
      output: [new Utxo(output1), new Utxo(output2)],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };

    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });
  it('should prove with older deposit', async () => {
    const keys = vanchorBn2542_16_2;
    const keypair = new Keypair();

    const utxosAfterDeposit = await Promise.all(Array(16)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: (index + 16).toString(),
          keypair,
          originChainId: '0'
        });

        return utxo;
      }));
    const utxos = await Promise.all(Array(16)
      .fill(0)
      .map(async (_, index) => {
        const utxo = await Utxo.generateUtxo({
          amount: '10',
          backend: 'Arkworks',
          chainId: '0',
          curve: 'Bn254',
          index: index.toString(),
          keypair,
          originChainId: '0'
        });

        return utxo;
      }));
    const publicAmount = 10;
    const outputAmount = String(10 * 8 + 5);
    const outputChainId = String(0);
    const leaves = [...utxos, ...utxosAfterDeposit].map((utxo) => utxo.commitment);

    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const leavesMap: any = {};

    leavesMap[0] = leaves;

    const output1 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined, hexToU8a(keypair.getPubKey()));
    const output2 = new JsUtxo('Bn254', 'Arkworks', outputAmount, outputChainId, undefined, hexToU8a(keypair.getPubKey()));
    const address = hexToU8a('0x644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129');

    const provingManager = new ArkworksProvingManager(null);

    const secret = randomAsU8a();
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    await ensureIndicies(utxos, leaves);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      encryptedCommitments: [comEnc1, comEnc2],
      extAmount: '0',
      fee: '0',
      inputUtxos: utxos,
      leafIds: [...utxos.map((utxo) => {
        return { index: utxo.index!, typedChainId: Number(utxo.chainId) };
      })],
      leavesMap,
      output: [new Utxo(output1), new Utxo(output2)],

      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      recipient: address,
      refund: '0',
      relayer: address,
      roots: rootsSet,
      token: address
    };

    const data = await provingManager.prove('vanchor', setup);
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(keys.vk).replace('0x', ''), 'Bn254');

    expect(isValidProof).to.deep.equal(true);
  });
});
