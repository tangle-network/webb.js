/* eslint-disable @typescript-eslint/no-unused-vars */
describe('Generating Bulletproof', () => {
  it('generate bulletproofGens', async () => {
    const wasm = await import('@webb-tools/mixer-client/mixer-client');
    const opts = new wasm.PoseidonHasherOptions();
    const gens = opts.bp_gens;
    // @ts-ignore
    await expect(true).benchmark({
      pre_generate_bulletproof_gens: () => {
        const localOpts = new wasm.PoseidonHasherOptions();
        localOpts.bp_gens = gens;
        const hasher = new wasm.PoseidonHasher(localOpts);
        hasher.free();
      },
      without_gens: () => {
        const localOpts = new wasm.PoseidonHasherOptions();
        const hasher = new wasm.PoseidonHasher(localOpts);
        hasher.free();
      }
    });
  });
});
