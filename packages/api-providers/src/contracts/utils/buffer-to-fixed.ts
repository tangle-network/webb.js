// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

export const bufferToFixed = (number: Buffer | any, length = 32) => {
  return (
    '0x' + (number instanceof Buffer ? number.toString('hex') : BigInt(number).toString(16)).padStart(length * 2, '0')
  );
};
