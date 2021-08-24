import { WorkerWithEvents } from '@webb-tools/app-util/shared/worker-with-events.class';
import { LoggerService } from '@webb-tools/app-util';
import type { DepositNote, Leaves } from '@webb-tools/wasm-utils';

type Events = 'generateZkp' | 'addLeaves';

type Rx = {
  generateZkp: {
    note: DepositNote;
    leaves: Leaves;
    relayer: string;
    recipient: string;
    fee: number;
    refund: number;
  };
  addLeaves: [];
};

type Tx = {
  generateZkp: '';
  addLeaves: undefined;
};

export class SdkMixer extends WorkerWithEvents<Events, Tx, Rx> {
  protected Logger = LoggerService.get('sdk-mixer');

  private static async wasm() {
    return import('@webb-tools/wasm-utils');
  }

  private async generateZKP(paylaod: Rx['generateZkp']) {
    const wasm = await SdkMixer.wasm();
    const pm = new wasm.ProvingManager();
    pm.set_note(paylaod.note);
    pm.set_leaves(paylaod.leaves);
    pm.set_recipient(paylaod.recipient);
    pm.set_recipient(paylaod.relayer);
    pm.set_note(paylaod.note);
    pm.set_fee(paylaod.fee);
    pm.set_refund(paylaod.refund);

    const proof = pm.proof();
    return proof;
  }
  eventHandler<Name extends keyof Rx>(name: Name, value: Rx[Name]) {
    switch (name) {
      case 'generateZkp':
        this.generateZKP(value as Rx['generateZkp']);
      case 'addLeaves':
        break;
    }
  }
}
