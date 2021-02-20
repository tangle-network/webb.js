import { MerkleTree, createHash } from '@guildofweavers/merkle';

export * from './wasm-thread';
export * from './leaf';
export * from './hash';
export * from './tree';
export * from '@guildofweavers/merkle';

export const buildMerkleTree = (leaves: Array<Uint8Array>): Promise<MerkleTree> => {
  const hash = createHash('sha256');
  const leafBufs = leaves.map((leaf) => Buffer.from(leaf));
  const tree = MerkleTree.create(leafBufs, hash);
  return Promise.resolve(tree);
};
