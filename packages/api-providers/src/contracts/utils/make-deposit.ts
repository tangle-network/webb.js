// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { JsNote as DepositNote } from '@webb-tools/wasm-utils';
import crypto from 'crypto';
// @ts-ignore
import * as ff from 'ffjavascript';

import { PoseidonHasher } from './merkle/index.js';
import { bufferToFixed } from './buffer-to-fixed.js';
import { poseidonHash3 } from './poseidon-hash3.js';

const { utils } = ff;
const { leBuff2int } = utils;

// const utils = require('ffjavascript').utils;
// const rbigint = (nbytes: number) => utils.leBuff2int(crypto.randomBytes(nbytes));

export type Deposit = {
  preimage: Uint8Array;
  commitment: string;
  nullifierHash: string;
  secret: string;
  nullifier: string;
  chainId?: number;
};

export function createAnchor2Deposit (chainId: number) {
  const poseidonHasher = new PoseidonHasher();
  const preimage = crypto.randomBytes(62);
  const nullifier = leBuff2int(preimage.slice(0, 31));
  const secret = leBuff2int(preimage.slice(31, 62));

  console.log('chainId: ', chainId);
  const commitmentBN = poseidonHash3([chainId, nullifier, secret]);
  const nullifierHash = poseidonHasher.hash(null, nullifier, nullifier);

  console.log('secret: ', secret);
  console.log('nullifier: ', nullifier);
  console.log('commitmentBN: ', commitmentBN);
  const commitment = bufferToFixed(commitmentBN);

  console.log('commitment when creating deposit note: ', commitment);

  const deposit: Deposit = {
    chainId: chainId,
    commitment,
    nullifier: bufferToFixed(nullifier).substring(2),
    nullifierHash,
    preimage,
    secret: bufferToFixed(secret).substring(2)
  };

  return deposit;
}

export function depositFromAnchorNote (note: DepositNote): Deposit {
  const poseidonHasher = new PoseidonHasher();
  const noteSecretParts = note.secrets.split(':');
  const chainId = Number(note.targetChainId);
  const preimageString = note.secrets.replaceAll(':', '');
  const preimage = Buffer.from(preimageString);
  const nullifier = '0x' + noteSecretParts[1];
  const secret = '0x' + noteSecretParts[2];
  const commitmentBN = poseidonHash3([chainId, nullifier, secret]);
  const nullifierHash = poseidonHasher.hash(null, nullifier, nullifier);
  const commitment = bufferToFixed(commitmentBN);

  const deposit: Deposit = {
    chainId: chainId,
    commitment,
    nullifier: bufferToFixed(nullifier),
    nullifierHash,
    preimage,
    secret: bufferToFixed(secret)
  };

  return deposit;
}
