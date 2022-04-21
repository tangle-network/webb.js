import { ApiPromise } from '@polkadot/api';
import { options } from '@webb-tools/api';

async function main() {
  // Default connection to localhost:9944
  const api = new ApiPromise(options());
  await api.isReady;

  const leafCount = await api.derive.merkleTreeBn254.getLeafCountForTree(0);

  console.log('leafCount for the tree of id 0: ', leafCount);

  const leaves = await api.derive.merkleTreeBn254.getLeavesForTree(0, 0, 1);
  leaves.map((leaf) => {
    console.log('leaf: ', leaf.valueOf());
  })
}

main();
