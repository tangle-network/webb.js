// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import '@webb-tools/api-derive/augmentDerives.js';

import { derive as webbDerives } from '@webb-tools/api-derive/index.js';

import { ApiOptions } from '@polkadot/api/types';

/**
 *
 * @returns Returns the `ApiOptions` for a Webb `protocol-substrate` node.
 */
export const options = ({
  types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  derives = {},
  ...otherOptions
}: ApiOptions = {}): ApiOptions => ({
  derives: {
    ...webbDerives,
    ...derives,
  },
  rpc: {
    // TODO: Remove the mt_getLeaves rpc in favor of api derives.
    mt: {
      getLeaves: {
        description: 'Query for the tree leaves',
        params: [
          {
            isOptional: false,
            name: 'tree_id',
            type: 'u32',
          },
          {
            isOptional: false,
            name: 'from',
            type: 'u32',
          },
          {
            isOptional: false,
            name: 'to',
            type: 'u32',
          },
          {
            isOptional: true,
            name: 'at',
            type: 'Hash',
          },
        ],
        type: 'Vec<[u8; 32]>',
      },
    },
    ...rpc,
  },
  types: {
    ...types,
  },
  typesAlias: {
    ...typesAlias,
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      webb: {
        ...typesBundle?.spec?.webb,
      },
    },
  },
  ...otherOptions,
});

/**
 *
 * @param chainTypes - An object containing the `types` and `typesBundle` of another chain
 * @returns The `ApiOptions` of the chain with Webb's types added.
 */
export const optionsWithChain =
  (chainTypes: any) =>
  ({ types = {}, rpc = {}, typesAlias = {}, typesBundle = {}, ...otherOptions }: ApiOptions = {}): ApiOptions => ({
    rpc: {
      ...rpc,
    },
    types: {
      ...chainTypes.types,
      ...types,
    },
    typesAlias: {
      ...typesAlias,
    },
    typesBundle: {
      ...typesBundle,
      spec: {
        ...typesBundle.spec,
        ...chainTypes.typesBundle.spec,
        webb: {
          ...typesBundle?.spec?.webb,
        },
      },
    },
    ...otherOptions,
  });
