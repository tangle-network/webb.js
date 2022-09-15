// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import type { Backend, Curve, JsUtxo } from '@webb-tools/wasm-utils';

import { hexToU8a } from '@polkadot/util';

import { toBuffer } from './big-number-utils.js';
import { Keypair } from './keypair.js';

export type UtxoGenInput = {
  curve: Curve,
  backend: Backend,
  amount: string,
  chainId: string,
  blinding?: Uint8Array
  index?: string,
  keypair?: Keypair,
  originChainId?: string
};

/**
 * Utxos are objects used to represent ownership of value within a VAnchor instance.
 * The input Utxos to a VAnchor transaction represent the spending a previously created Utxo.
 *   - Therefore, input Utxos should have a privkey configured on the given Utxo's keypair.
 * The output Utxos to a VAnchor transaction represent the creation of new Utxos.
 *   - Therefore, output Utxos don't need to have a privkey configured on the given Utxo's keypair.
 */
export class Utxo {
  keypair: Keypair = new Keypair();
  originChainId: string | undefined;

  /** Initialize a new UTXO - unspent transaction output or input. Note, a full TX consists of 2/16 inputs and 2 outputs
   *
   * @param inner - The wasm representation of a utxo
   */
  constructor (readonly inner: JsUtxo) {

  }

  private static get wasm () {
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
      // If node is running in an esm context, return esm compliant package.
      return import('@webb-tools/wasm-utils/njs/wasm-utils-njs.js');
    } else {
      return import('@webb-tools/wasm-utils/wasm-utils.js');
    }
  }

  serialize (): string {
    return this.inner.serialize();
  }

  static async deserialize (utxoString: string): Promise<Utxo> {
    const wasm = await Utxo.wasm;
    const utxo = wasm.JsUtxo.deserialize(utxoString);

    return new Utxo(utxo);
  }

  static async generateUtxo (input: UtxoGenInput): Promise<Utxo> {
    const wasm = await Utxo.wasm;
    let wasmUtxoPrivateKey;

    if (input.keypair && input.keypair.privkey) {
      wasmUtxoPrivateKey = hexToU8a(input.keypair.privkey);
    }

    const wasmUtxo = new wasm.JsUtxo(
      input.curve,
      input.backend,
      input.amount,
      input.chainId,
      input.index,
      wasmUtxoPrivateKey,
      input.blinding
    );

    const utxo = new Utxo(wasmUtxo);

    if (input.keypair) {
      utxo.setKeypair(input.keypair);
    }

    utxo.setOriginChainId(input.originChainId);

    return utxo;
  }

  /**
   * Encrypt UTXO data using the current keypair.
   * This is used in the externalDataHash calculations so the funds for this deposit
   * can only be spent by the owner of `this.keypair`.
   *
   * @returns `0x`-prefixed hex string with data
   */
  encrypt () {
    if (!this.keypair) {
      throw new Error('Must set a keypair to encrypt the utxo');
    }

    const bytes = Buffer.concat([
      toBuffer(`0x${this.chainId}`, 8),
      toBuffer(`0x${this.amount}`, 31),
      toBuffer(`0x${this.blinding}`, 31)
    ]);

    return this.keypair.encrypt(bytes);
  }

  /**
   * Decrypt a UTXO
   *
   * @param keypair - keypair used to decrypt
   * @param data - hex string with data
   * @returns a UTXO object
   */
  static async decrypt (keypair: Keypair, data: string) {
    const decryptedUtxoString = keypair.decrypt(data).toString();

    if (decryptedUtxoString.length !== 70) {
      throw new Error('Attempted to decrypt malformed data');
    }

    return Utxo.deserialize(decryptedUtxoString);
  }

  getKeypair () {
    return this.keypair;
  }

  setKeypair (keypair: Keypair) {
    this.keypair = keypair;
  }

  getOriginChainId () {
    return this.originChainId;
  }

  setOriginChainId (originChainId: string | undefined) {
    this.originChainId = originChainId;
  }

  get amount (): string {
    return this.inner.amount;
  }

  get blinding (): string {
    return this.inner.blinding;
  }

  get chainId (): string {
    return this.inner.chainId;
  }

  /**
   * Returns commitment for this UTXO
   *
   * @returns the poseidon hash of [chainId, amount, pubKey, blinding]
   */
  get commitment (): Uint8Array {
    return this.inner.commitment;
  }

  /**
   * @returns the index configured on this UTXO. Output UTXOs generated
   * before they have been inserted in a tree.
   *
   * TODO: Return null instead of 0 for the index if it is an output utxo?
   */
  get index (): number|undefined {
    if (this.inner.index !== undefined) {
      return Number(this.inner.index);
    }

    return undefined;
  }

  /**
   * @returns the nullifier: hash of [commitment, index, signature]
   * where signature = hash([secret key, commitment, index])
   */
  get nullifier (): string {
    return this.inner.nullifier;
  }

  /**
   * @returns the public key used for generating the commitment.
   * If the utxo is configured with a secret_key, this value should be poseidonHash(secret_key)
   */
  get public_key (): string {
    throw new Error('Can\'t get the public_key on base UTXO');
  }

  /**
   * @returns the secret_key AKA private_key used in the nullifier.
   */
  get secret_key (): string {
    return this.inner.secret_key;
  }

  /**
   * @returns secrets - an array of secret values represented in the utxo
   */
  getSecrets (): string[] {
    if (!this.keypair.privkey) {
      throw new Error('Missing private key for secrets');
    }

    return [this.chainId, this.amount, this.keypair.privkey, this.blinding];
  }
}
