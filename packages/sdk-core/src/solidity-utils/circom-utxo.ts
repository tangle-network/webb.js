import type { Backend, Curve, JsUtxo } from '@webb-tools/wasm-utils';

import { poseidon } from 'circomlibjs';
import { BigNumber } from 'ethers';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { randomBN, toBuffer, toFixedHex } from '../big-number-utils.js';
import { Keypair } from '../keypair.js';
import { Utxo, UtxoGenInput } from '../utxo.js';

/// The CircomUtxo class implements the Utxo interface so that
/// the same 'Utxo' type may be used in serialization between worker contexts
export class CircomUtxo extends Utxo {
  _curve: Curve = 'Bn254';
  _backend: Backend = 'Circom';
  _amount = '';
  _chainId = '';
  _index?: number;
  _pubkey = '';
  _secret_key = '';
  _blinding = '';
  _originChainId?: string;

  private constructor (readonly inner: JsUtxo) {
    super(inner);
  }

  serialize (): string {
    return [
      this._curve,
      this._backend,
      this.amount,
      this.chainId,
      this.index.toString(),
      this.blinding,
      this.keypair.getPubKey(),
      this.keypair?.getEncryptionKey(),
      this.secret_key
    ].join('&');
  }

  static async deserialize (utxoString: string): Promise<Utxo> {
    const inner = new CircomJsUtxo();

    const utxo = new CircomUtxo(inner);
    const parts = utxoString.split('&');

    utxo._curve = 'Bn254';
    utxo._backend = 'Circom';
    utxo._amount = parts[2];
    utxo._chainId = parts[3];
    utxo._index = Number(parts[4]);
    utxo._blinding = parts[5];
    utxo._pubkey = parts[6];
    const maybeEncryptionKey = parts[7];
    const maybeSecretKey = parts[8];

    if (maybeSecretKey.length === 66) {
      utxo.setKeypair(new Keypair(maybeSecretKey));
    } else {
      if (maybeEncryptionKey.length === 66) {
        utxo.setKeypair(Keypair.fromString(utxo._pubkey + maybeEncryptionKey.slice(2)));
      } else {
        utxo.setKeypair(Keypair.fromString(utxo._pubkey));
      }
    }

    return utxo;
  }

  static async generateUtxo (input: UtxoGenInput): Promise<Utxo> {
    const inner = new CircomJsUtxo();
    const utxo = new CircomUtxo(inner);

    // Required parameters
    utxo._amount = input.amount;
    utxo._chainId = input.chainId;
    utxo._curve = input.curve;
    utxo._backend = input.backend;

    // Optional parameters
    utxo._index = input.index ? Number(input.index) : 0;

    if (input.keypair) {
      utxo._secret_key = input.keypair.privkey || '';
      utxo._pubkey = input.keypair.getPubKey();
      utxo.setKeypair(input.keypair);
    }

    utxo._blinding = input.blinding ? u8aToHex(input.blinding) : toFixedHex(randomBN(31));
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
      toBuffer(BigNumber.from(this._chainId), 8),
      toBuffer(BigNumber.from(this._amount), 31),
      toBuffer(BigNumber.from(this._blinding), 31)
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
    const buf = keypair.decrypt(data);

    if (buf.length !== 70) {
      throw new Error('malformed utxo encryption');
    }

    const utxo = await CircomUtxo.generateUtxo({
      amount: BigNumber.from('0x' + buf.slice(8, 8 + 31).toString('hex')).toString(),
      backend: 'Circom',
      blinding: hexToU8a('0x' + buf.slice(8 + 31, 8 + 62).toString('hex')),
      chainId: BigNumber.from('0x' + buf.slice(0, 8).toString('hex')).toString(),
      curve: 'Bn254',
      keypair
    });

    return utxo;
  }

  get amount (): string {
    return this._amount;
  }

  set amount (amount: string) {
    this._amount = amount;
  }

  get blinding (): string {
    return this._blinding;
  }

  set blinding (blinding: string) {
    this._blinding = blinding;
  }

  get chainId (): string {
    return this._chainId;
  }

  set chainId (chainId: string) {
    this._chainId = chainId;
  }

  /**
   * Returns commitment for this UTXO
   *
   * @returns the poseidon hash of [chainId, amount, pubKey, blinding]
   */
  get commitment (): Uint8Array {
    const hash = poseidon([this._chainId, this._amount, this._pubkey, this._blinding]);

    return hexToU8a(BigNumber.from(hash).toHexString());
  }

  createCommitmentWithPubkey (pubkey: string): Uint8Array {
    const hash = poseidon([this._chainId, this._amount, pubkey, this._blinding]);

    return hexToU8a(BigNumber.from(hash).toHexString());
  }

  /**
   * @returns the index configured on this UTXO. Output UTXOs generated
   * before they have been inserted in a tree.
   *
   */
  get index (): number {
    return this._index ?? 0;
  }

  set index (index: number) {
    this._index = index;
  }

  /**
   * @returns the nullifier: hash of [commitment, index, signature] as decimal string
   * where signature = hash([secret key, commitment, index])
   */
  get nullifier (): string {
    // If the amount of the UTXO is zero, then the nullifier is not important.
    // Return a 'dummy' value that will satisfy the circuit
    // Enforce index on the UTXO if there is an amount greater than zero
    if (!this.keypair || !this.keypair.privkey) {
      throw new Error('Cannot create nullifier, keypair with private key not configured');
    }

    const x = poseidon([
      u8aToHex(this.commitment),
      this.index > 0 ? this.index : 0,
      // The following parameter is the 'ownership hash', a portion of the nullifier that enables
      // compliance, and ties a utxo to a particular keypair.
      poseidon([this.keypair.privkey, this.commitment, this.index])
    ]);

    return x.toString();
  }

  /**
   * @returns the secret_key AKA private_key used in the nullifier.
   * this value is used to derive the public_key for the commitment.
   */
  get secret_key (): string {
    return this._secret_key;
  }

  set secret_key (secret: string) {
    this._secret_key = secret;
  }

  setKeypair (keypair: Keypair): void {
    this._pubkey = keypair.getPubKey();

    if (keypair?.privkey) {
      this._secret_key = keypair.privkey;
    }

    this.keypair = keypair;
  }
}

// Implemented to satisfy the Utxo interface, not meant to be used.
// TODO: Support leaf generation in wasm-utils for non-arkworks
class CircomJsUtxo implements JsUtxo {
  free (): void {
    throw new Error('Method not implemented.');
  }

  serialize (): string {
    throw new Error('Method not implemented.');
  }

  amount = '';
  blinding = '';
  chainId = '';
  chainIdRaw = BigInt(0);
  commitment: Uint8Array = new Uint8Array();
  index: any;
  nullifier = '';
  secret_key = '';
}
