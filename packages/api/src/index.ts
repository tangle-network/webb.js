// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import '@webb-tools/protocol-substrate-types';
import '@webb-tools/api-derive/augmentDerives.js';

import { derive as webbDerives } from '@webb-tools/api-derive/index.js';

import { ApiOptions } from '@polkadot/api/types';

export const rpcProperties = {
  lt: {
    getNeighborEdges: {
      description: 'Query for the neighbor edges',
      params: [
        {
          isOptional: false,
          name: 'tree_id',
          type: 'u32'
        },
        {
          isOptional: true,
          name: 'at',
          type: 'Hash'
        }
      ],
      type: 'Vec<PalletLinkableTreeEdgeMetadata>'
    },
    getNeighborRoots: {
      description: 'Query for the neighbor roots',
      params: [
        {
          isOptional: false,
          name: 'tree_id',
          type: 'u32'
        },
        {
          isOptional: true,
          name: 'at',
          type: 'Hash'
        }
      ],
      type: 'Vec<[u8; 32]>'
    }
  },
  mt: {
    getLeaves: {
      description: 'Query for the tree leaves',
      params: [
        {
          isOptional: false,
          name: 'tree_id',
          type: 'u32'
        },
        {
          isOptional: false,
          name: 'from',
          type: 'u32'
        },
        {
          isOptional: false,
          name: 'to',
          type: 'u32'
        },
        {
          isOptional: true,
          name: 'at',
          type: 'Hash'
        }
      ],
      type: 'Vec<[u8; 32]>'
    }
  }
};

/**
 *
 * @returns Returns the `ApiOptions` for a Webb `protocol-substrate` node.
 */
export const options = ({ derives = {},
  types = {},
  typesAlias = {},
  typesBundle = {},
  ...otherOptions }: ApiOptions = {}): ApiOptions => ({
  derives: {
    ...webbDerives,
    ...derives
  },
  rpc: rpcProperties,
  types: {
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
export const optionsWithChain =
  (chainTypes: any) =>
    ({ rpc = {}, types = {}, typesAlias = {}, typesBundle = {}, ...otherOptions }: ApiOptions = {}): ApiOptions => ({
      rpc: {
        ...rpc
      },
      types: {
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
