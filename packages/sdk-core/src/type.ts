// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.
import { BigNumberish } from 'ethers';

export interface RootInfo {
  merkleRoot: BigNumberish;
  chainId: BigNumberish;
}

export type KNOWN_MODULES = 'merkle' | 'mixer';

export type CHAIN = 'dev' | 'webb';
