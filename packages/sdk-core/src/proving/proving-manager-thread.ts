import type { JsProofInput, Leaves, Proof } from '@webb-tools/wasm-utils';
import { u8aToHex } from '@polkadot/util';
import { ProofI } from '@webb-tools/sdk-core/proving/proving-manager';
import { Note } from '../note';

export type ProvingManagerSetupInput = {
  note: string;
  relayer: string;
  recipient: string;
  leaves: Leaves;
  leafIndex: number;
  fee: number;
  refund: number;
  provingKey: Uint8Array;
  roots?: Leaves;
  refreshCommitment?: string;
};

type PMEvents = {
  proof: ProvingManagerSetupInput;
  destroy: undefined;
};

export class ProvingManagerWrapper {
  constructor(private ctx: 'worker' | 'direct-call' = 'worker') {
    if (ctx === 'worker') {
      self.addEventListener('message', async (event) => {
        const message = event.data as Partial<PMEvents>;
        const key = Object.keys(message)[0] as keyof PMEvents;
        switch (key) {
          case 'proof':
            {
              const input = message.proof!;
              const proof = await this.proof(input);
              (self as unknown as Worker).postMessage({
                name: key,
                data: proof
              });
            }
            break;
          case 'destroy':
            (self as unknown as Worker).terminate();
            break;
        }
      });
    }
  }

  private get wasmBlob() {
    return this.ctx === 'worker' ? import('@webb-tools/wasm-utils') : import('@webb-tools/wasm-utils/njs');
  }

  private get proofBuilder() {
    return this.wasmBlob.then((wasm) => {
      return wasm.ProofInputBuilder;
    });
  }

  private async generateProof(proofInput: JsProofInput): Promise<Proof> {
    const wasm = await this.wasmBlob;
    return wasm.generate_proof_js(proofInput);
  }

  async proof(pmSetupInput: ProvingManagerSetupInput): Promise<ProofI> {
    const Manager = await this.proofBuilder;
    const pm = new Manager();
    const { note } = await Note.deserialize(pmSetupInput.note);
    // TODO: handle the prefix and validation
    pm.setLeaves(pmSetupInput.leaves);
    pm.setRelayer(pmSetupInput.relayer);
    pm.setRecipient(pmSetupInput.recipient);
    pm.setLeafIndex(String(pmSetupInput.leafIndex));
    pm.setRefund(String(pmSetupInput.refund));
    pm.setFee(String(pmSetupInput.fee));
    pm.setPk(u8aToHex(pmSetupInput.provingKey).replace('0x', ''));
    pm.setNote(note);

    if (pmSetupInput.roots) {
      pm.setRoots(pmSetupInput.roots);
    }
    if (pmSetupInput.refreshCommitment) {
      pm.setRefreshCommitment(pmSetupInput.refreshCommitment);
    }
    const proofInput = pm.build_js();
    const proof = await this.generateProof(proofInput);
    return {
      proof: proof.proof,
      root: proof.root,
      nullifierHash: proof.nullifierHash,
      roots: proof.roots
    };
  }
}
