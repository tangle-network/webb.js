import { Scalar } from '@webb-tools/sdk-mixer';

export class ZKProof {
  constructor(
    public readonly leafIndexCommitments: Array<Scalar>,
    public readonly commitments: Array<Scalar>,
    public readonly proofCommitments: Array<Scalar>,
    public readonly nullifierHash: Scalar,
    public readonly proof: Scalar
  ) {}
}
