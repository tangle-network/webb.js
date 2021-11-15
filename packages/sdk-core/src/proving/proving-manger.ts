import { ProvingManagerSetupInput } from '@webb-tools/sdk-core/proving/proving-manager-thread';

export class ProvingManger {
  constructor(private readonly worker: Worker) {}

  proof(input: ProvingManagerSetupInput): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        this.worker.addEventListener('message', (e) => {
          const payload = e.data.data as string;
          resolve(payload);
        });
        this.worker.postMessage({
          proof: input
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
