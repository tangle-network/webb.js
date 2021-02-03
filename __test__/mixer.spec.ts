import { Mixer, MixerAssetGroup } from '@webb-tools/sdk-mixer';

describe('Mixer', () => {
  const groups = [new MixerAssetGroup(0, 'EDG', 32)];
  it('can create new mixer', () => {
    const mixer = new Mixer(groups);
    expect(mixer).toBeInstanceOf(Mixer);
  });
});
