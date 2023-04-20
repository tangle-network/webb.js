// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import '@webb-tools/protocol-substrate-types';

import { MerkleTree } from '@webb-tools/sdk-core/index.js';
import { createLocalPolkadotApi, polkadotTx } from '@webb-tools/test-utils/index.js';
import { expect } from 'chai';

import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';

describe.skip('getLeafCountForTree should work', function () {
  this.timeout(120_000);

  let signer: KeyringPair;
  let api: ApiPromise;

  before(async () => {
    // Setup the signer for the transactions

    const alicePhrase = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice';

    await cryptoWaitReady();
    const k = new Keyring({ type: 'sr25519' });

    signer = k.addFromMnemonic(alicePhrase);
  });

  // This test assumes a node is running at localhost - but this interferes with
  // integration tests run through docker.
  it.skip('get the leaf count after a deposit', async () => {
    api = await createLocalPolkadotApi();

    // Assume there exists a tree with id 0 on the local substrate node
    const leafCountBefore = await api.derive.merkleTreeBn254.getLeafCountForTree(0);

    await polkadotTx(
      api,
      {
        section: 'merkleTreeBn254',
        // eslint-disable-next-line sort-keys
        method: 'insert'
      },
      [0, '0x1111111111111111111111111111111111111111111111111111111111111111'],
      signer
    );

    const leafCountAfter = await api.derive.merkleTreeBn254.getLeafCountForTree(0);

    expect(leafCountAfter).to.eq(leafCountBefore + 1);
  });

  it.skip('should match on-chain merkle tree and tree created from leaves for getLeaves', async () => {
    api = await createLocalPolkadotApi();

    const leafCount = await api.derive.merkleTreeBn254.getLeafCountForTree(0);
    const chainTree = await api.query.merkleTreeBn254.trees(0);
    const chainRoot = chainTree.unwrap().root.toString();

    const leaves = await api.derive.merkleTreeBn254.getLeavesForTree(0, 0, leafCount - 1);
    const stringLeaves = leaves.map((leaf) => {
      return `0x${Buffer.from(leaf).toString('hex')}`;
    });

    console.log('chainRoot: ', chainRoot);
    console.log(stringLeaves);
    const calculatedTree = new MerkleTree(30, stringLeaves);

    expect(BigInt(calculatedTree.root().toString())).to.eq(BigInt(chainRoot));
  });
});
