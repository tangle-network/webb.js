// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { WebbError, WebbErrorCodes } from '../../webb-error';
import { bufferToFixed } from './buffer-to-fixed';
import { Deposit } from './make-deposit';
import { pedersenHash } from './pedersen-hash';

const snarkjs = require('tornado-snarkjs');

export class EvmNote {
  constructor (
    private _currency: string,
    private _amount: number,
    private _chainId: number,
    private _preImage: Uint8Array
  ) {}

  static deserialize (noteString: string) {
    const noteRegex = /anchor-(?<currency>\w+)-(?<amount>[\d.]+)-(?<chainId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g;

    try {
      const { amount, chainId, currency, note } = noteRegex.exec(noteString)?.groups as Record<string, any>;

      return new EvmNote(currency, Number(amount), Number(chainId), Buffer.from(note, 'hex'));
    } catch (e) {
      throw WebbError.from(WebbErrorCodes.NoteParsingFailure);
    }
  }

  serialize () {
    return this.toString();
  }

  get currency () {
    return this._currency;
  }

  get amount () {
    return this._amount;
  }

  get chainId () {
    return this._chainId;
  }

  get preImage () {
    return this._preImage;
  }

  get preImageHex () {
    return bufferToFixed(this.preImage, 62);
  }

  toString () {
    return `anchor-${this.currency}-${this.amount}-${this.chainId}-${this.preImageHex}`;
  }

  intoDeposit (): Deposit {
    const commitment = pedersenHash(this.preImage);
    const nullifier = snarkjs.bigInt.leBuff2int(this.preImage.slice(0, 31));
    const secret = snarkjs.bigInt.leBuff2int(this.preImage.slice(31, 62));

    const nullifierHash = pedersenHash(nullifier.leInt2Buff(31));

    return {
      commitment,
      nullifier,
      nullifierHash,
      preimage: this.preImage,
      secret
    };
  }
}
