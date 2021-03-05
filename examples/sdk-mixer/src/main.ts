// @ts-ignore
import Worker from './mixer.worker.ts';
import { Mixer, MixerAssetGroup } from '@webb-tools/sdk-mixer';

async function bulletProffMixer() {
  const worker = new Worker();
  console.time('Bulletproof');
  const gens = await Mixer.preGenerateBulletproofGens(worker);
  console.timeEnd('Bulletproof');
  const assetGroup = [1, 2, 3].map((id) => new MixerAssetGroup(id, 'EDG', 32));
  console.time('Mixer');
  const mixer = await Mixer.init(worker, assetGroup, gens);
  console.timeEnd('Mixer');
  mixer.destroy();
}

bulletProffMixer();
