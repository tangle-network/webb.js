// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { InternalChainId } from '../chains';

export type ChainAddressConfig = { [key in InternalChainId]?: string };

export type AnchorConfigEntry = {
  amount: string;
  // EVM based
  anchorAddresses: ChainAddressConfig;
  // Substrate based
  anchorTreeIds: ChainAddressConfig;
};
