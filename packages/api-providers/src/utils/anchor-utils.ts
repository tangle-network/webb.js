// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AppConfig } from '@webb-tools/api-providers';

import { InternalChainId } from '../chains';
import { WebbCurrencyId } from '../enums';

export const getAnchorAddressForBridge = (
  assetId: WebbCurrencyId,
  chainId: number,
  amount: number,
  bridgeConfigByAsset: AppConfig['bridgeByAsset']
): string | undefined => {
  const linkedAnchorConfig = bridgeConfigByAsset[assetId]?.anchors.find(
    (anchor) => anchor.amount === amount.toString()
  );

  if (!linkedAnchorConfig) {
    throw new Error('Unsupported configuration for bridge');
  }

  const anchorAddress = linkedAnchorConfig.anchorAddresses[chainId as InternalChainId];

  return anchorAddress;
};
