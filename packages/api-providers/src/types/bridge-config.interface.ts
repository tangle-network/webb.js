// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { WebbCurrencyId } from '../enums/index.js';
import { AnchorConfigEntry } from './anchor-config.interface.js';

export interface BridgeConfig {
  asset: WebbCurrencyId;
  anchors: AnchorConfigEntry[];
}
