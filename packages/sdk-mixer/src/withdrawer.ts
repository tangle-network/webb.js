import { Note, Scalar } from '@webb-tools/sdk-mixer';
import * as sys from '@webb-tools/mixer-client';

export class ZKProof {
  constructor(
    public readonly leafIndexCommitments: Array<Scalar>,
    public readonly commitments: Array<Scalar>,
    public readonly proofCommitments: Array<Scalar>,
    public readonly nullifierHash: Scalar,
    public readonly proof: Scalar
  ) {}
}

export class Withdrawer {
  constructor(private readonly mixer: sys.Mixer, private readonly root: Uint8Array, private readonly note: Note) {}

  /**
   * generate a zkproof and then do the withdraw operation using this ZKProof.
   **/
  public async proofAndWithdraw(fn: (zkProof: ZKProof) => Promise<void>): Promise<void> {
    type ZKProofMap = Map<'comms' | 'nullifier_hash' | 'leaf_index_comms' | 'proof_comms' | 'proof', unknown>;
    const savedNote = this.mixer.save_note(this.note.serialize());
    const leaf = savedNote.get('leaf') as Uint8Array;
    const zkProofMap = this.mixer.generate_proof(this.note.tokenSymbol, this.note.id, this.root, leaf) as ZKProofMap;
    const zkProof = new ZKProof(
      zkProofMap.get('leaf_index_comms') as Scalar[],
      zkProofMap.get('comms') as Scalar[],
      zkProofMap.get('proof_comms') as Scalar[],
      zkProofMap.get('nullifier_hash') as Scalar,
      zkProofMap.get('proof') as Scalar
    );
    await fn(zkProof);
  }
}
