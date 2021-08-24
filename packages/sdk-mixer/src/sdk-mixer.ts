import { WorkerWithEvents } from '@webb-tools/app-util/shared/worker-with-events.class';
import { LoggerService } from '@webb-tools/app-util';
import type { Leaves } from '@webb-tools/wasm-utils';

type Events = 'generateZkp';

type Rx = {
  generateZkp: {
    noteString: string;
    leaves: Leaves;
    relayer: string;
    recipient: string;
    fee: number;
    refund: number;
  };
};

type Tx = {
  generateZkp: {
    proof: string;
  };
};

export class SdkMixer extends WorkerWithEvents<Events, Tx, Rx> {
  protected Logger = LoggerService.get('sdk-mixer');

  private static async wasm() {
    return import('@webb-tools/wasm-utils');
  }

  private async generateZKP(paylaod: Rx['generateZkp']) {
    const wasm = await SdkMixer.wasm();
    this.Logger.trace('Init proving manager');
    const pm = new wasm.ProvingManager();
    const note = wasm.DepositNote.deserialize(paylaod.noteString);
    this.Logger.trace('Note Deserialize');
    pm.set_note(note);
    pm.set_leaves(paylaod.leaves);
    pm.set_recipient(paylaod.recipient);
    pm.set_recipient(paylaod.relayer);
    pm.set_fee(paylaod.fee);
    pm.set_refund(paylaod.refund);
    const proof = pm.proof();
    this.Logger.trace('Proof generation done ', proof);
    // emit the event to the Worker
    this.emit('generateZkp', {
      proof
    });
  }
  eventHandler<Name extends keyof Rx>(name: Name, value: Rx[Name]) {
    switch (name) {
      case 'generateZkp':
        this.generateZKP(value as Rx['generateZkp']);
    }
  }
}
