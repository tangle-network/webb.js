// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* tslint:disable */
/* eslint-disable */
import '@webb-tools/types/build/index.js';

// import { MerkleTree } from '@webb-tools/merkle-tree';
// import { createLocalPolkadotApi, polkadotTx } from '@webb-tools/test-utils/src/index.js';
// import { expect } from 'chai';
// // import { BigNumber } from 'ethers';
//
// import { ApiPromise, Keyring } from '@polkadot/api';
// import { KeyringPair } from '@polkadot/keyring/types';
// import { cryptoWaitReady } from '@polkadot/util-crypto';
//
// describe('getLeafCountForTree should work', function () {
//   this.timeout(120_000);
//
//   let signer: KeyringPair;
//   let api: ApiPromise;
//
//   before(async () => {
//     // Setup the signer for the transactions
//
//     const alicePhrase = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice';
//
//     await cryptoWaitReady();
//     const k = new Keyring({ type: 'sr25519' });
//
//     signer = k.addFromMnemonic(alicePhrase);
//   });
//
//   // This test assumes a node is running at localhost - but this interferes with
//   // integration tests run through docker.
//   it.skip('get the leaf count after a deposit', async () => {
//     api = await createLocalPolkadotApi();
//
//     // Assume there exists a tree with id 0 on the local substrate node
//     const leafCountBefore = await api.derive.merkleTreeBn254.getLeafCountForTree(0);
//
//     await polkadotTx(
//       api,
//       {
//         section: 'merkleTreeBn254',
//         // eslint-disable-next-line sort-keys
//         method: 'insert'
//       },
//       [0, '0x1111111111111111111111111111111111111111111111111111111111111111'],
//       signer
//     );
//
//     const leafCountAfter = await api.derive.merkleTreeBn254.getLeafCountForTree(0);
//
//     expect(leafCountAfter).to.eq(leafCountBefore + 1);
//   });
//
//
// });
