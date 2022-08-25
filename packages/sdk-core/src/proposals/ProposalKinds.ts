import { hexToU8a, u8aToHex } from '@polkadot/util';

import { ProposalHeader } from './ProposalHeader.js';
import { ResourceId } from './ResourceId.js';

export interface IAnchorUpdateProposal {
  /**
   * The Anchor Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 32 bytes Hex-encoded string of the `merkleRoot`.
   */
  readonly merkleRoot: string;
  /**
   * 32 bytes Hex-encoded string of the `srcResourceId`.
   */
  readonly srcResourceId: ResourceId;
}

export class AnchorUpdateProposal implements IAnchorUpdateProposal {
  header: ProposalHeader;
  merkleRoot: string;
  srcResourceId: ResourceId;

  constructor (header: ProposalHeader, merkleRoot: string, srcResourceId: ResourceId) {
    this.header = header;
    this.merkleRoot = merkleRoot;
    this.srcResourceId = srcResourceId;
  }

  static fromBytes (bytes: Uint8Array): AnchorUpdateProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const merkleRoot = u8aToHex(bytes.slice(40, 72));
    const srcResourceId = ResourceId.fromBytes(bytes.slice(72, 104));

    return new AnchorUpdateProposal(header, merkleRoot, srcResourceId);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const updateProposal = new Uint8Array(40 + 32 + 32);

    updateProposal.set(header, 0); // 0 -> 40

    const merkleRoot = hexToU8a(this.merkleRoot, 256).slice(0, 32);

    updateProposal.set(merkleRoot, 40); // 40 -> 72
    updateProposal.set(this.srcResourceId.toU8a(), 72); // 72 -> 104

    return updateProposal;
  }
}

export interface ITokenAddProposal {
  /**
     * The Token Add Proposal Header.

     */
  readonly header: ProposalHeader;
  /**
     * 20 bytes Hex-encoded string.
     */
  readonly newTokenAddress: string;
}

export class TokenAddProposal implements ITokenAddProposal {
  header: ProposalHeader;
  newTokenAddress: string;

  constructor (header: ProposalHeader, newTokenAddress: string) {
    this.header = header;
    this.newTokenAddress = newTokenAddress;
  }

  static fromBytes (bytes: Uint8Array): TokenAddProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const newTokenAddress = u8aToHex(bytes.slice(40, 60));

    return new TokenAddProposal(header, newTokenAddress);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const tokenAddProposal = new Uint8Array(40 + 20);

    tokenAddProposal.set(header, 0); // 0 -> 40
    tokenAddProposal.set(hexToU8a(this.newTokenAddress, 160).slice(0, 20), 40); // 40 -> 60

    return tokenAddProposal;
  }
}

export interface ITokenRemoveProposal {
  /**
   * The Token Remove Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 20 bytes Hex-encoded string.
   */
  readonly removeTokenAddress: string;
}

export class TokenRemoveProposal implements ITokenRemoveProposal {
  header: ProposalHeader;
  removeTokenAddress: string;

  constructor (header: ProposalHeader, removeTokenAddress: string) {
    this.header = header;
    this.removeTokenAddress = removeTokenAddress;
  }

  static fromBytes (bytes: Uint8Array): TokenRemoveProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const removeTokenAddress = u8aToHex(bytes.slice(40, 60));

    return new TokenRemoveProposal(header, removeTokenAddress);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const tokenRemoveProposal = new Uint8Array(40 + 20);

    tokenRemoveProposal.set(header, 0); // 0 -> 40
    tokenRemoveProposal.set(hexToU8a(this.removeTokenAddress, 160).slice(0, 20), 40); // 40 -> 60

    return tokenRemoveProposal;
  }
}

export interface IWrappingFeeUpdateProposal {
  /**
   * The Wrapping Fee Update Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 2 byte Hex-encoded string.
   */
  readonly newFee: string;
}

export class WrappingFeeUpdateProposal implements IWrappingFeeUpdateProposal {
  header: ProposalHeader;
  newFee: string;

  constructor (header: ProposalHeader, newFee: string) {
    this.header = header;
    this.newFee = newFee;
  }

  static fromBytes (bytes: Uint8Array): WrappingFeeUpdateProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const newFee = u8aToHex(bytes.slice(40, 42));

    return new WrappingFeeUpdateProposal(header, newFee);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const wrappingFeeUpdateProposal = new Uint8Array(40 + 2);

    wrappingFeeUpdateProposal.set(header, 0); // 0 -> 40
    wrappingFeeUpdateProposal.set(hexToU8a(this.newFee, 16).slice(0, 2), 40); // 40 -> 42

    return wrappingFeeUpdateProposal;
  }
}

export interface IMinWithdrawalLimitProposal {
  /**
   * The Wrapping Fee Update Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 32 bytes Hex-encoded string.
   */
  readonly minWithdrawalLimitBytes: string;
}

export class MinWithdrawalLimitProposal implements IMinWithdrawalLimitProposal {
  header: ProposalHeader;
  minWithdrawalLimitBytes: string;

  constructor (header: ProposalHeader, minWithdrawalLimitBytes: string) {
    this.header = header;
    this.minWithdrawalLimitBytes = minWithdrawalLimitBytes;
  }

  static fromBytes (bytes: Uint8Array): MinWithdrawalLimitProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const minWithdrawalLimitBytes = u8aToHex(bytes.slice(40, 72));

    return new MinWithdrawalLimitProposal(header, minWithdrawalLimitBytes);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const minWithdrawalLimitProposal = new Uint8Array(40 + 32);

    minWithdrawalLimitProposal.set(header, 0); // 0 -> 40
    minWithdrawalLimitProposal.set(hexToU8a(this.minWithdrawalLimitBytes, 256).slice(0, 32), 40); // 40 -> 72

    return minWithdrawalLimitProposal;
  }
}

export interface IMaxDepositLimitProposal {
  /**
   * The Wrapping Fee Update Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 32 bytes Hex-encoded string.
   */
  readonly maxDepositLimitBytes: string;
}

export class MaxDepositLimitProposal implements IMaxDepositLimitProposal {
  header: ProposalHeader;
  maxDepositLimitBytes: string;

  constructor (header: ProposalHeader, maxDepositLimitBytes: string) {
    this.header = header;
    this.maxDepositLimitBytes = maxDepositLimitBytes;
  }

  static fromBytes (bytes: Uint8Array): MaxDepositLimitProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const maxDepositLimitBytes = u8aToHex(bytes.slice(40, 72));

    return new MaxDepositLimitProposal(header, maxDepositLimitBytes);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const maxDepositLimitProposal = new Uint8Array(40 + 32);

    maxDepositLimitProposal.set(header, 0); // 0 -> 40
    maxDepositLimitProposal.set(hexToU8a(this.maxDepositLimitBytes, 256).slice(0, 32), 40); // 40 -> 72

    return maxDepositLimitProposal;
  }
}

export interface IResourceIdUpdateProposal {
  /**
   * The ResourceIdUpdateProposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 32 bytes Hex-encoded string.
   */
  readonly newResourceId: string;
  /**
   * 20 bytes Hex-encoded string.
   */
  readonly handlerAddress: string;
}

export class ResourceIdUpdateProposal implements IResourceIdUpdateProposal {
  header: ProposalHeader;
  newResourceId: string;
  handlerAddress: string;

  constructor (header: ProposalHeader, newResourceId: string, handlerAddress: string) {
    this.header = header;
    this.newResourceId = newResourceId;
    this.handlerAddress = handlerAddress;
  }

  static fromBytes (bytes: Uint8Array): ResourceIdUpdateProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const newResourceId = u8aToHex(bytes.slice(40, 72));
    const handlerAddress = u8aToHex(bytes.slice(72, 92));

    return new ResourceIdUpdateProposal(header, newResourceId, handlerAddress);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const resourceIdUpdateProposal = new Uint8Array(40 + 32 + 20);

    resourceIdUpdateProposal.set(header, 0); // 0 -> 40
    resourceIdUpdateProposal.set(hexToU8a(this.newResourceId, 256).slice(0, 32), 40); // 40 -> 72
    resourceIdUpdateProposal.set(hexToU8a(this.handlerAddress, 160).slice(0, 20), 72); // 72 -> 92

    return resourceIdUpdateProposal;
  }
}

export interface ISetTreasuryHandlerProposal {
  /**
   * The Token Add Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 20 bytes Hex-encoded string.
   */
  readonly newTreasuryHandler: string;
}

export class SetTreasuryHandlerProposal implements ISetTreasuryHandlerProposal {
  header: ProposalHeader;
  newTreasuryHandler: string;

  constructor (header: ProposalHeader, newTreasuryHandler: string) {
    this.header = header;
    this.newTreasuryHandler = newTreasuryHandler;
  }

  static fromBytes (bytes: Uint8Array): SetTreasuryHandlerProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const newTreasuryHandler = u8aToHex(bytes.slice(40, 60));

    return new SetTreasuryHandlerProposal(header, newTreasuryHandler);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const setTreasuryHandlerProposal = new Uint8Array(40 + 20);

    setTreasuryHandlerProposal.set(header, 0); // 0 -> 40
    setTreasuryHandlerProposal.set(hexToU8a(this.newTreasuryHandler, 160).slice(0, 20), 40); // 40 -> 60

    return setTreasuryHandlerProposal;
  }
}

export interface ISetVerifierProposal {
  /**
   * The Token Add Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 20 bytes Hex-encoded string.
   */
  readonly newVerifier: string;
}

export class SetVerifierProposal implements ISetVerifierProposal {
  header: ProposalHeader;
  newVerifier: string;

  constructor (header: ProposalHeader, newVerifier: string) {
    this.header = header;
    this.newVerifier = newVerifier;
  }

  static fromBytes (bytes: Uint8Array): SetVerifierProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const newVerifier = u8aToHex(bytes.slice(40, 60));

    return new SetVerifierProposal(header, newVerifier);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const setVerifierProposal = new Uint8Array(40 + 20);

    setVerifierProposal.set(header, 0); // 0 -> 40
    setVerifierProposal.set(hexToU8a(this.newVerifier, 160).slice(0, 20), 40); // 40 -> 60

    return setVerifierProposal;
  }
}

export interface IFeeRecipientUpdateProposal {
  /**
   * The Token Add Proposal Header.
   */
  readonly header: ProposalHeader;
  /**
   * 20 bytes Hex-encoded string.
   */
  readonly newFeeRecipient: string;
}

export class FeeRecipientUpdateProposal implements IFeeRecipientUpdateProposal {
  header: ProposalHeader;
  newFeeRecipient: string;

  constructor (header: ProposalHeader, newFeeRecipient: string) {
    this.header = header;
    this.newFeeRecipient = newFeeRecipient;
  }

  static fromBytes (bytes: Uint8Array): FeeRecipientUpdateProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const newFeeRecipient = u8aToHex(bytes.slice(40, 60));

    return new FeeRecipientUpdateProposal(header, newFeeRecipient);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const feeRecipientUpdateProposal = new Uint8Array(40 + 20);

    feeRecipientUpdateProposal.set(header, 0); // 0 -> 40
    feeRecipientUpdateProposal.set(hexToU8a(this.newFeeRecipient, 160).slice(0, 20), 40); // 40 -> 60

    return feeRecipientUpdateProposal;
  }
}

export interface IRescueTokensProposal {
  /**
   * The Rescue Token Proposals Header.
   */
  readonly header: ProposalHeader;

  /**
   * 20 bytes Hex-encoded string.
   */
  readonly tokenAddress: string;
  /**
   * 20 bytes Hex-encoded string.
   */
  readonly toAddress: string;
  /**
   * 32 bytes Hex-encoded string.
   */
  readonly amount: string;
}

export class RescueTokensProposal implements IRescueTokensProposal {
  header: ProposalHeader;
  tokenAddress: string;
  toAddress: string;
  amount: string;

  constructor (header: ProposalHeader, tokenAddress: string, toAddress: string, amount: string) {
    this.header = header;
    this.tokenAddress = tokenAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  static fromBytes (bytes: Uint8Array): RescueTokensProposal {
    const header = ProposalHeader.fromBytes(bytes.slice(0, 40));
    const tokenAddress = u8aToHex(bytes.slice(40, 60));
    const toAddress = u8aToHex(bytes.slice(60, 80));
    const amount = u8aToHex(bytes.slice(80, 112));

    return new RescueTokensProposal(header, tokenAddress, toAddress, amount);
  }

  toU8a (): Uint8Array {
    const header = this.header.toU8a();
    const rescueTokensProposal = new Uint8Array(40 + 20 + 20 + 32);

    rescueTokensProposal.set(header, 0); // 0 -> 40
    rescueTokensProposal.set(hexToU8a(this.tokenAddress, 160).slice(0, 20), 40); // 40 -> 60
    rescueTokensProposal.set(hexToU8a(this.toAddress, 160).slice(0, 20), 60); // 60 -> 80
    rescueTokensProposal.set(hexToU8a(this.amount, 256).slice(0, 32), 80); // 80 -> 112

    return rescueTokensProposal;
  }
}
