// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { poseidon } from 'circomlibjs';
import { decrypt, encrypt, getEncryptionPublicKey } from 'eth-sig-util';
import { BigNumber, ethers } from 'ethers';

import { toFixedHex } from './big-number-utils';

export function packEncryptedMessage (encryptedMessage: any) {
  const nonceBuf = Buffer.from(encryptedMessage.nonce, 'base64');
  const ephemPublicKeyBuf = Buffer.from(encryptedMessage.ephemPublicKey, 'base64');
  const ciphertextBuf = Buffer.from(encryptedMessage.ciphertext, 'base64');
  const messageBuff = Buffer.concat([
    Buffer.alloc(24 - nonceBuf.length),
    nonceBuf,
    Buffer.alloc(32 - ephemPublicKeyBuf.length),
    ephemPublicKeyBuf,
    ciphertextBuf
  ]);

  return '0x' + messageBuff.toString('hex');
}

export function unpackEncryptedMessage (encryptedMessage: any) {
  if (encryptedMessage.slice(0, 2) === '0x') {
    encryptedMessage = encryptedMessage.slice(2);
  }

  const messageBuff = Buffer.from(encryptedMessage, 'hex');
  const nonceBuf = messageBuff.slice(0, 24);
  const ephemPublicKeyBuf = messageBuff.slice(24, 56);
  const ciphertextBuf = messageBuff.slice(56);

  return {
    ciphertext: ciphertextBuf.toString('base64'),
    ephemPublicKey: ephemPublicKeyBuf.toString('base64'),
    nonce: nonceBuf.toString('base64'),
    version: 'x25519-xsalsa20-poly1305'
  };
}

export class Keypair {
  privkey: string;
  pubkey: ethers.BigNumber;
  encryptionKey: string;

  /**
   * Initialize a new keypair. Generates a random private key if not defined
   *
   * @param privkey - hex string
   */
  constructor (privkey = ethers.Wallet.createRandom().privateKey) {
    this.privkey = privkey;
    this.pubkey = poseidon([this.privkey]);
    this.encryptionKey = getEncryptionPublicKey(privkey.slice(2));
  }

  toString () {
    return toFixedHex(this.pubkey) + Buffer.from(this.encryptionKey, 'base64').toString('hex');
  }

  /**
   * Key address for this keypair, alias to {@link toString}
   */
  address () {
    return this.toString();
  }

  /**
   * Initialize new keypair from address string
   *
   * @param str - A string which contains the public key from (0,64) and
   *              the encryption key from (64, 128)
   * @returns The keypair object
   */
  static fromString (str: string) {
    if (str.length === 130) {
      str = str.slice(2);
    }

    if (str.length !== 128) {
      throw new Error('Invalid key length');
    }

    return Object.assign(new Keypair(), {
      encryptionKey: Buffer.from(str.slice(64, 128), 'hex').toString('base64'),
      privkey: null,
      pubkey: BigNumber.from('0x' + str.slice(0, 64))
    });
  }

  /**
   * Encrypt data using keypair encryption key
   *
   * @param bytes - A buffer to encrypt
   * @returns a hex string encoding of encrypted data with this encryption key
   */
  encrypt (bytes: Buffer) {
    return packEncryptedMessage(
      encrypt(this.encryptionKey, { data: bytes.toString('base64') }, 'x25519-xsalsa20-poly1305')
    );
  }

  /**
   * Decrypt data using keypair private key
   *
   * @param data - a hex string with data
   * @returns A Buffer of the decrypted data
   */
  decrypt (data: string) {
    return Buffer.from(decrypt(unpackEncryptedMessage(data), this.privkey.slice(2)), 'base64');
  }

  /**
   * Sign a message using keypair private key
   *
   * @param commitment - a hex string with commitment
   * @param merklePath - a hex string with merkle path
   * @returns a hex string with signature
   */
  sign (commitment: string|number|BigNumber, merklePath: string|number|BigNumber) {
    return poseidon([this.privkey, commitment, merklePath]);
  }
}

module.exports = {
  Keypair,
  packEncryptedMessage,
  unpackEncryptedMessage
};
