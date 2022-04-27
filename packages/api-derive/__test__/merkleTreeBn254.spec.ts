// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { MerkleTree, PoseidonHasher } from '@webb-tools/api-providers/contracts/utils/merkle';
import { createLocalPolkadotApi, polkadotTx } from '@webb-tools/test-utils/src/index.js';
import { expect } from 'chai';

import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';

describe('getLeafCountForTree should work', function () {
  let signer: KeyringPair;
  let api: ApiPromise;

  before(async () => {
    // Setup the signer for the transactions

    const alicePhrase =
    'bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice';

    await cryptoWaitReady();
    const k = new Keyring({ type: 'sr25519' });

    signer = k.addFromMnemonic(alicePhrase);
    api = await createLocalPolkadotApi();
  });

  this.timeout(120_000);

  // This test assumes a node is running at localhost - but this interferes with
  // integration tests run through docker.
  it('get the leaf count after a deposit', async () => {
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

  it('should match on-chain merkle tree and tree created from leaves for getLeaves', async () => {
    const leafCount = await api.derive.merkleTreeBn254.getLeafCountForTree(0);
    const chainTree = await api.query.merkleTreeBn254.trees(0);
    const chainRoot = chainTree.unwrap().root.toString();

    const leaves = await api.derive.merkleTreeBn254.getLeavesForTree(0, 0, leafCount);
    const calculatedTree = MerkleTree.new('', 30, leaves, new PoseidonHasher());

    expect(calculatedTree.getRoot()).to.eq(chainRoot);
  });
});
