import { assert } from 'chai';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { BE } from './index.js';
import { IResourceId, ResourceId } from './ResourceId.js';

/**
 * Proposal Header is the first 40 bytes of any proposal and it contains the following information:
 * - resource id (32 bytes)
 * - target chain id (4 bytes) encoded as the last 4 bytes of the resource id.
 * - target function signature (4 bytes)
 * - nonce (4 bytes).
 */
export interface IProposalHeader {
  /**
   * 32 bytes Hex-encoded string of the `ResourceID` for this proposal.
   */
  readonly resourceId: IResourceId;
  /**
   * 4 bytes Hex-encoded string of the `functionSig` for this proposal.
   */
  readonly functionSignature: string;
  /**
   * 4 bytes Hex-encoded string of the `nonce` for this proposal.
   */
  readonly nonce: number;
}

/**
 * Proposal Header class
 */
export class ProposalHeader implements IProposalHeader {
  resourceId: IResourceId;
  functionSignature: string;
  nonce: number;

  constructor (resourceId: IResourceId, functionSignature: string, nonce: number) {
    this.resourceId = resourceId;
    this.functionSignature = functionSignature;
    this.nonce = nonce;
  }

  /**
   * Converts a 40-byte Uint8Array into a proposal header.
   */
  static fromBytes (bytes: Uint8Array): ProposalHeader {
    assert(bytes.length === 40, 'bytes must be 40 bytes');

    const resourceId = ResourceId.fromBytes(bytes.slice(0, 32));
    const functionSignature = bytes.slice(32, 36).toString();
    const nonce = new DataView(bytes).getUint32(36, BE);

    return new ProposalHeader(resourceId, functionSignature, nonce);
  }

  /**
   * Converts the proposal header into a 40-byte Uint8Array.
   */
  toU8a (): Uint8Array {
    const proposalHeader = new Uint8Array(40);

    proposalHeader.set(this.resourceId.toU8a(), 0);
    proposalHeader.set(hexToU8a(this.functionSignature), 32);
    proposalHeader.set(hexToU8a(this.nonce.toString(16)), 36);

    return proposalHeader;
  }

  /**
   * Converts the proposal header into a 40-byte Hex-encoded string.
   */
  toString (): string {
    return u8aToHex(this.toU8a());
  }
}
