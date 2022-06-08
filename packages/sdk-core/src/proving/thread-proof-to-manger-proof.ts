import type { NoteProtocol } from '@webb-tools/wasm-utils';

import { DeserializeVAnchorProof, Note, ProvingManagerProof, WasmUtxo, WorkerProof } from '@webb-tools/sdk-core/index.js';

export async function threadProofToMangerProof<T extends NoteProtocol> (
  protocol: T,
  proofData: WorkerProof<T>): Promise<ProvingManagerProof<T>> {
  switch (protocol) {
    case 'vanchor': {
      const sourceVAcnhorProof = {
        ...proofData
      } as unknown as WorkerProof<'vanchor'>;
      const deserializeVAnchorProofData = sourceVAcnhorProof as any as DeserializeVAnchorProof;

      deserializeVAnchorProofData.outputNotes = await Promise.all(sourceVAcnhorProof.outputNotes.map((note) => Note.deserialize(note)));
      deserializeVAnchorProofData.inputUtxos = await Promise.all(sourceVAcnhorProof.inputUtxos.map((utxo) => WasmUtxo.deserialize(utxo)));

      return deserializeVAnchorProofData as any;
    }

    default:
      return proofData as any;
  }
}
