import { WorkerWithEvents } from '@webb-tools/app-util/shared/worker-with-events.class';
import { LoggerService } from '@webb-tools/app-util';
import type { Leaves, Proof } from '@webb-tools/wasm-utils';

type Events = 'generateZKP';

export type Rx = {
  generateZKP: {
    noteString: string;
    leaves: Leaves;
    relayer: string;
    recipient: string;
    fee: number;
    refund: number;
  };
};

export type Tx = {
  generateZKP: {
    proof: Proof;
  };
};

export class MixerWorker extends WorkerWithEvents<Events, Tx, Rx> {
  protected Logger = LoggerService.get('Mixer-Worker');

  private static async wasm() {
    return import('@webb-tools/wasm-utils');
  }

  private async generateZKP(payload: Rx['generateZKP']) {
    const wasm = await MixerWorker.wasm();
    this.Logger.trace('Init proving manager');
    const pm = new wasm.ProvingManager();
    const note = wasm.DepositNote.deserialize(payload.noteString);
    this.Logger.trace('Note Deserialize');
    pm.setNote(note);
    pm.setLeaves(payload.leaves);
    pm.setRecipient(payload.recipient);
    pm.setRelayer(payload.relayer);
    pm.setFee(payload.fee);
    pm.setRefund(payload.refund);
    const proof = pm.proof();
    this.Logger.trace('Proof generation done ', proof);
    // emit the event to the Worker
    this.emit('generateZKP', {
      proof
    });
  }

  eventHandler<Name extends keyof Rx>(name: Name, value: Rx[Name]) {
    switch (name) {
      case 'generateZKP':
        this.generateZKP(value as Rx['generateZKP']);
    }
  }
}
