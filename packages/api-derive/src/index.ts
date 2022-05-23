// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import type { DeriveCustom } from '@polkadot/api-base/types';

import * as merkleTreeBn254 from './merkleTreeBn254/index.js';

export const derive: DeriveCustom = {
  merkleTreeBn254: merkleTreeBn254 as unknown as DeriveCustom[string]
};
