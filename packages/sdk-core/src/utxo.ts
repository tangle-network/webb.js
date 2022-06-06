// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// @ts-ignore
import { babyjub, poseidon } from 'circomlibjs';
import { BigNumber, BigNumberish } from 'ethers';
import { Scalar } from 'ffjavascript';

import { randomBN, toBuffer } from './big-number-utils.js';
import { Keypair } from './keypair.js';
import { RootInfo } from './type.js';

export class Utxo {
  chainId: BigNumber;
  amount: BigNumber;
  blinding: BigNumber;
  keypair: Keypair;
  originChainId: BigNumber;
  index: number | null;
  _commitment?: BigNumber;
  _nullifier?: BigNumber;

  /** Initialize a new UTXO - unspent transaction output or input. Note, a full TX consists of 2/16 inputs and 2 outputs
   *
   * @param chainId - The destination chain Id
   * @param amount - UTXO amount
   * @param blinding - Blinding factor
   * @param keypair - The keypair used for commitment (pub), nullifier (priv), and encryption / decryption (enc)
   * @param index - UTXO index in the merkle tree
   */
  constructor ({ amount,
    blinding,
    chainId,
    index,
    keypair,
    originChainId }: {chainId: BigNumberish, amount?: BigNumberish, keypair?: Keypair, blinding?: BigNumberish, originChainId?: BigNumberish, index?: number}) {
    this.chainId = BigNumber.from(chainId);
    this.amount = amount ? BigNumber.from(amount) : BigNumber.from(0);
    this.blinding = blinding ? BigNumber.from(blinding) : randomBN();
    this.keypair = keypair || new Keypair();
    this.originChainId = originChainId ? BigNumber.from(originChainId) : BigNumber.from(0);
    this.index = index || null;
  }

  /**
   * Returns commitment for this UTXO
   *
   * @returns the poseidon hash of the [chainId, amount, pubKey, blinding]
   */
  getCommitment () {
    if (!this._commitment) {
      this._commitment = BigNumber.from(poseidon([this.chainId, this.amount, this.keypair.pubkey, this.blinding]));
    }

    return this._commitment;
  }

  /**
   * Returns nullifier for this UTXO
   */
  getNullifier () {
    if (!this._nullifier) {
      if (
        this.amount.lt(0) &&
        (this.index === undefined ||
          this.index === null ||
          this.keypair.privkey === undefined ||
          this.keypair.privkey === null)
      ) {
        throw new Error('Can not compute nullifier without utxo index or private key');
      }

      const signature = this.keypair.privkey ? this.keypair.sign(BigNumber.from(this.getCommitment()), this.index || 0) : 0;

      this._nullifier = BigNumber.from(poseidon([this.getCommitment(), this.index || 0, signature]));
    }

    return this._nullifier;
  }

  getDiffs (roots: RootInfo[]): BigNumberish[] {
    const targetRoot = roots.find((root) => root.chainId.toString() === this.originChainId.toString());

    return roots.map((diff) => {
      return BigNumber.from(babyjub.F.sub(Scalar.fromString(diff.merkleRoot.toString()), Scalar.fromString(targetRoot?.merkleRoot.toString())).toString());
    });
  }

  /**
   * Encrypt UTXO data using the current keypair
   *
   * @returns `0x`-prefixed hex string with data
   */
  encrypt () {
    const bytes = Buffer.concat([toBuffer(this.chainId, 16), toBuffer(this.amount, 31), toBuffer(this.blinding, 31)]);

    return this.keypair.encrypt(bytes);
  }

  /**
   * Decrypt a UTXO
   *
   * @param keypair - keypair used to decrypt
   * @param data - hex string with data
   * @param index - UTXO index in merkle tree
   * @returns a UTXO object
   */
  static decrypt (keypair: Keypair, data: string, index: number) {
    const buf = keypair.decrypt(data);
    const utxo = new Utxo({
      amount: BigNumber.from('0x' + buf.slice(16, 16 + 31).toString('hex')),
      blinding: BigNumber.from('0x' + buf.slice(16 + 31, 16 + 62).toString('hex')),
      chainId: BigNumber.from('0x' + buf.slice(0, 16).toString('hex')),
      keypair
    });

    utxo.index = index;

    return utxo;
  }
}
