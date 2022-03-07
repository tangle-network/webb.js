import {
  rpc as webbRpc,
  types as webbTypes,
  typesAlias as webbTypesAlias,
  typesBundle as webbTypesBundle
} from '@webb-tools/types';
import { ApiOptions } from '@polkadot/api/types';

export const defaultOptions: ApiOptions = {
  types: webbTypes,
  rpc: webbRpc
};

/**
 * 
 * @returns Returns the `ApiOptions` for a Webb `protocol-substrate` node.
 */
export const options = ({
  types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  ...otherOptions
}: ApiOptions = {}): ApiOptions => ({
  types: {
    ...webbTypes,
    ...types
  },
  rpc: {
    ...webbRpc,
    ...rpc
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
 * @param chainTypes An object containing the `types` and `typesBundle` of another chain
 * @returns The `ApiOptions` of the chain with Webb's types added.
 */
export const optionsWithChain = (chainTypes: any) => ({
  types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  ...otherOptions
}: ApiOptions = {}): ApiOptions => ({
  types: {
    ...webbTypes,
    ...chainTypes.types,
    ...types,
    Address: 'MultiAddress',
    LookupSource: 'MultiAddress'
  },
  rpc: {
    ...webbRpc,
    ...rpc
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
