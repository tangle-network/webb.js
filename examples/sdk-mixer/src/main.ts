// @ts-ignore
import Worker from './mixer.worker.ts';
import { Mixer, MixerAssetGroup } from '@webb-tools/sdk-mixer';

async function main() {
  const assetGroup = [1, 2, 3].map((id) => new MixerAssetGroup(id, 'EDG', 32));
  console.log(assetGroup);
  console.log(`mixer initing`);
  const mixer = await Mixer.init(new Worker(), assetGroup);
  console.log(`mixer inited`);
  console.log(mixer);
}
main();
