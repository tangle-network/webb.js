// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { IAnchorDepositInfo } from '@webb-tools/interfaces';
import { PoseidonHasher, toFixedHex } from '@webb-tools/utils';
import { JsNote as DepositNote } from '@webb-tools/wasm-utils';

export function depositFromAnchorNote (note: DepositNote): IAnchorDepositInfo {
  const poseidonHasher = new PoseidonHasher();
  const noteSecretParts = note.secrets.split(':');
  const chainId = Number(note.targetChainId);
  const nullifier = '0x' + noteSecretParts[1];
  const secret = '0x' + noteSecretParts[2];
  const commitmentBN = poseidonHasher.hash3([chainId, nullifier, secret]);
  const nullifierHash = poseidonHasher.hash(null, nullifier, nullifier);
  const commitment = toFixedHex(commitmentBN);

  const deposit: IAnchorDepositInfo = {
    chainID: BigInt(chainId),
    commitment: `0x${commitment}`,
    nullifier: BigInt(toFixedHex(nullifier)),
    nullifierHash,
    secret: BigInt(toFixedHex(secret))
  };

  return deposit;
}
