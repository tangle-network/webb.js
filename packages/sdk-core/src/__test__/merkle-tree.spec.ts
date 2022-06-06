// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import { MerkleTree } from '../merkle-tree.js';

describe('Merkle Tree tests', () => {
  const elements = [12, 13, 14, 15, 16, 17, 18, 19, 20];

  describe('construction tests', () => {
    it('should evaluate the same for constructor with elements and constructor with insertions', () => {
      const treeWithElements = new MerkleTree(15, elements);

      const treeThenInsert = new MerkleTree(15);

      for (const element of elements) {
        treeThenInsert.insert(element);
      }

      console.log(treeWithElements.path(0));

      expect(treeThenInsert.root().toHexString()).to.eq(treeWithElements.root().toHexString());
    });
  });

  describe('insertion tests', () => {
    it('should evaluate the same for bulkInsert and single insert', () => {
      const singleTree = new MerkleTree(6);
      const bulkTree = new MerkleTree(6);

      bulkTree.bulkInsert(elements);

      for (const el of elements) {
        singleTree.insert(el);
      }

      console.log(bulkTree.path(0));
      console.log(singleTree.path(0));

      for (let i = 0; i < elements.length; i++) {
        const bulkPath = bulkTree.path(i);
        const singlePath = singleTree.path(i);

        expect(bulkPath.merkleRoot.toHexString()).to.eq(singlePath.merkleRoot.toHexString());
        expect(bulkPath.element.toHexString()).to.eq(singlePath.element.toHexString());
        expect(bulkPath.pathIndices).to.eql(singlePath.pathIndices);
        expect(bulkPath.pathElements).to.eql(singlePath.pathElements);
      }
    });

    it('should find an element', async () => {
      const tree = new MerkleTree(20);

      tree.bulkInsert(elements);
      let index = tree.getIndexByElement(13);

      expect(index).to.eq(1);

      index = tree.getIndexByElement(19);
      expect(index).to.eq(7);

      index = tree.getIndexByElement(12);
      expect(index).to.eq(0);

      index = tree.getIndexByElement(20);
      expect(index).to.eq(8);

      index = tree.getIndexByElement(42);
      expect(index).to.eq(-1);
    });
  });

  it('should correctly calculate the index from pathIndices', () => {
    const pathIndices = [0, 1, 1, 0, 1];
    const calculatedIndex = MerkleTree.calculateIndexFromPathIndices(pathIndices);

    expect(calculatedIndex).to.eq(22);
  });
});