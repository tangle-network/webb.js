import { Mixer } from '@webb-tools/sdk-mixer';

describe('Mixer', () => {
  // This is just for local testing purposes
  it('should init', async () => {
    const mixer = await Mixer.init([]);
    expect(mixer).toBeInstanceOf(Mixer);
  });
});
