// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import webbTypesPkg from '@webb-tools/types/index.js';

import { ApiOptions } from '@polkadot/api/types';

const { rpc: webbRpc, types: webbTypes, typesAlias: webbTypesAlias, typesBundle: webbTypesBundle } = webbTypesPkg;

export const defaultOptions: ApiOptions = {
  rpc: webbRpc,
  types: webbTypes
};

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
    ...webbRpc,
    ...rpc
  },
  types: {
    ...webbTypes,
    ...types
  },
  typesAlias: {
    ...webbTypesAlias,
    ...typesAlias
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      webb: {
        ...webbTypesBundle?.spec?.webb,
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
    ...webbRpc,
    ...rpc
  },
  types: {
    ...webbTypes,
    ...chainTypes.types,
    ...types,
    Address: 'MultiAddress',
    LookupSource: 'MultiAddress'
  },
  typesAlias: {
    ...webbTypesAlias,
    ...typesAlias
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      ...chainTypes.typesBundle.spec,
      webb: {
        ...webbTypesBundle?.spec?.webb,
        ...typesBundle?.spec?.webb
      }
    }
  },
  ...otherOptions
});
