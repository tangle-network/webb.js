// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { IAnchorDepositInfo } from '@webb-tools/interfaces';
import { JsNote as DepositNote } from '@webb-tools/wasm-utils';
import crypto from 'crypto';
// @ts-ignore
import * as ff from 'ffjavascript';

import { PoseidonHasher } from './merkle/index.js';
import { bufferToFixed } from './buffer-to-fixed.js';
import { poseidonHash3 } from './poseidon-hash3.js';

const { utils } = ff;
const { leBuff2int } = utils;

export function createAnchor2Deposit (chainId: number) {
  const poseidonHasher = new PoseidonHasher();
  const preimage = crypto.randomBytes(62);
  const nullifier = leBuff2int(preimage.slice(0, 31));
  const secret = leBuff2int(preimage.slice(31, 62));

  const commitmentBN = poseidonHash3([chainId, nullifier, secret]);
  const nullifierHash = poseidonHasher.hash(null, nullifier, nullifier);
  const commitment = bufferToFixed(commitmentBN);

  const deposit: IAnchorDepositInfo = {
    chainID: BigInt(chainId),
    commitment,
    nullifier: nullifier,
    nullifierHash,
    secret: secret
  };

  return deposit;
}

export function depositFromAnchorNote (note: DepositNote): IAnchorDepositInfo {
  const poseidonHasher = new PoseidonHasher();
  const noteSecretParts = note.secrets.split(':');
  const chainId = Number(note.targetChainId);
  const nullifier = '0x' + noteSecretParts[1];
  const secret = '0x' + noteSecretParts[2];
  const commitmentBN = poseidonHash3([chainId, nullifier, secret]);
  const nullifierHash = poseidonHasher.hash(null, nullifier, nullifier);
  const commitment = bufferToFixed(commitmentBN);

  const deposit: IAnchorDepositInfo = {
    chainID: BigInt(chainId),
    commitment,
    nullifier: BigInt(bufferToFixed(nullifier)),
    nullifierHash,
    secret: BigInt(bufferToFixed(secret))
  };

  return deposit;
}
