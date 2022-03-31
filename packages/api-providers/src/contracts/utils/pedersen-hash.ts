// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line  @typescript-eslint/no-var-requires
const circomlib = require('tornado-circomlib');

export function pedersenHash (data: Uint8Array) {
  return circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
}
