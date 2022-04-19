// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import * as webbTypes from '@webb-tools/types/index.js';

import { ApiOptions } from '@polkadot/api/types';

/**
 *
 * @returns Returns the `ApiOptions` for a Webb `protocol-substrate` node.
 */
export const options = ({ types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  ...otherOptions }: ApiOptions = {}): ApiOptions => ({
  rpc: {
    ...rpc
  },
  // @ts-ignore
  types: {
    ...webbTypes,
    ...types
  },
  typesAlias: {
    ...typesAlias
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      webb: {
        ...typesBundle?.spec?.webb
      }
    }
  },
  ...otherOptions
});

/**
 *
 * @param chainTypes - An object containing the `types` and `typesBundle` of another chain
 * @returns The `ApiOptions` of the chain with Webb's types added.
 */
export const optionsWithChain = (chainTypes: any) => ({ types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  ...otherOptions }: ApiOptions = {}): ApiOptions => ({
  rpc: {
    ...rpc
  },
  types: {
    ...webbTypes,
    ...chainTypes.types,
    ...types
  },
  typesAlias: {
    ...typesAlias
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      ...chainTypes.typesBundle.spec,
      webb: {
        ...typesBundle?.spec?.webb
      }
    }
  },
  ...otherOptions
});
