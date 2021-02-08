import { Mixer, MixerAssetGroup } from '@webb-tools/sdk-mixer';

async function main() {
  await Mixer.init([new MixerAssetGroup(0, 'EDG', 32)]);
}

main()
  .then(() => {
    console.log('done');
  })
  .catch((e) => {
    console.log(e);
  });
