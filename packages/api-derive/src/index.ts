// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.

import type { DeriveCustom } from '@polkadot/api-base/types';

import * as merkleTreeBn254 from './merkleTreeBn254/index.js';

export const derive: DeriveCustom = {
  merkleTreeBn254: merkleTreeBn254 as unknown as DeriveCustom[string]
};
