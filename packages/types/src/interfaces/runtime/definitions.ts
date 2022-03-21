// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import runtime from '@webb-tools/type-definitions/runtime';

import definitions from '@polkadot/types/interfaces/runtime/definitions';
import { Definitions } from '@polkadot/types/types';

export default {
  rpc: {},
  types: {
    ...definitions.types,
    ...runtime.types
  }
} as Definitions;
