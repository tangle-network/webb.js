import { Leaves } from '@webb-tools/wasm-utils';

export type ProvingManagerSetupInput = { note: string; relayer: string; recipient: string; leaves: Leaves };

type PMEvents = {
  proof: ProvingManagerSetupInput;
  destroy: undefined;
};

export class ProvingManagerWrapper {
  private constructor() {
    self.addEventListener('message', async (event) => {
      const message = event.data as Partial<PMEvents>;
      const key = Object.keys(message)[0] as keyof PMEvents;
      switch (key) {
        case 'proof':
          {
            const input = message as PMEvents['proof'];
            const proof = await this.proof(input);
            ((self as unknown) as Worker).postMessage({
              name: key,
              data: proof
            });
          }
          break;
        case 'destroy':
          ((self as unknown) as Worker).terminate();
          break;
      }
    });
  }

  private static get manager() {
    return import('@webb-tools/wasm-utils').then((wasm) => {
      return wasm.ProvingManager;
    });
  }

  async proof(pmSetupInput: ProvingManagerSetupInput) {
    const Manager = await ProvingManagerWrapper.manager;
    const pm = new Manager();
    pm.setNoteStr(pmSetupInput.note);
    pm.setLeaves(pmSetupInput.leaves);
    pm.setRelayer(pmSetupInput.relayer);
    pm.setRelayer(pmSetupInput.recipient);
    return pm.proof();
  }
}
