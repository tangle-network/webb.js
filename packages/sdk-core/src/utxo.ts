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
    // The wasmUtxo is a string representation of the utxo. It has all of the information
    // required of the parts - except for the Keypair information used for encryption.
    const wasmUtxoString = this.inner.serialize();
    const parts = wasmUtxoString.split('&');

    const encryptionKey = this.keypair.getEncryptionKey()?.slice(2) ?? '';

    const utxoString = [
      parts[0],
      parts[1],
      parts[2],
      parts[3],
      parts[4],
      parts[5],
      encryptionKey,
      parts[6],
      parts[7]
    ].join('&');

    return utxoString;
  }

  /**
   * @param utxoString - A string representation of the parts that make up a utxo, split by '&'.
   *   - All values are represented as hex-encoded byte strings.
   *   - Relevant values will be interpreted as encoded in BigEndian
   *   - Optional values are represented as the empty string if not present,
   *     meaning the split call will always be an array of length "parts".
   *
   *   parts[0] - Curve value, e.g. Bn254, Bls381, Ed25519, etc.
   *   parts[1] - Backend value, e.g. arkworks or circom
   *   parts[2] - Amount in atomic units, e.g. ETH in wei amounts or DOT in 10^12 decimals
   *   parts[3] - TypedChainId, the hex value of the calculated typed chain id
   *   parts[4] - Blinding, secret random value
   *   parts[5] - PublicKey, the "publicKey = hash(privateKey)" value which indicates ownership for a utxo.
   *   parts[6] Optional - EncryptionKey, the public key of "publicKey = encryptionScheme(privateKey)" value used for messaging.
   *   parts[7] Optional - PrivateKey, the secret key component correlated to the above values.
   *   parts[8] Optional - Index, the leaf index if the utxo has been inserted in a merkle tree
   *
   * @returns The Utxo object with appropriately configured inner wasm instance.
   */

  static async deserialize (utxoString: string): Promise<Utxo> {
    const parts = utxoString.split('&');
    let reconstructedKeypair: Keypair;

    // deserialize the keypair portion before reconstructing the string meant for wasm
    if (parts[7].length === 64) {
      // If a private key was provided, create the keypair object with it.
      reconstructedKeypair = new Keypair('0x' + parts[7]);
    } else {
      if (parts[6].length === 64) {
        // If an encryption key was provided, create the keypair object with it.
        reconstructedKeypair = Keypair.fromString('0x' + parts[5] + parts[6]);
      } else {
        // If only a public key was provided, create the keypair object with it.
        reconstructedKeypair = Keypair.fromString('0x' + parts[5]);
      }
    }

    // Recreate the utxo string for wasm
    const wasmUtxoString = [
      parts[0],
      parts[1],
      parts[2],
      parts[3],
      parts[4],
      parts[5],
      parts[7],
      parts[8]
    ].join('&');

    const wasm = await Utxo.wasm;
    const utxo = wasm.JsUtxo.deserialize(wasmUtxoString);

    const retval = new Utxo(utxo);

    retval.keypair = reconstructedKeypair;

    return retval;
  }

  static async generateUtxo (input: UtxoGenInput): Promise<Utxo> {
    const wasm = await Utxo.wasm;
    let wasmUtxoPublicKey;
    let wasmUtxoPrivateKey;

    // Format the inputs as little-endian for wasm.
    if (input.keypair) {
      if (input.keypair.privkey) {
        wasmUtxoPrivateKey = hexToU8a(input.keypair.privkey);
      }

      wasmUtxoPublicKey = hexToU8a(input.keypair.getPubKey());
    }

    const wasmUtxo = new wasm.JsUtxo(
      input.curve,
      input.backend,
      input.amount,
      input.chainId,
      input.blinding,
      wasmUtxoPublicKey,
      wasmUtxoPrivateKey,
      input.index
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

  setIndex (index: number) {
    this.inner.index = BigInt(index);
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
