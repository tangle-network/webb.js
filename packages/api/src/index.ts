import { derive as webbDerives } from '@webb-tools/api-derive';
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
  derives: {
    ...webbDerives
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      webb: {
        ...webbTypesBundle?.spec?.webb,
        ...typesBundle?.spec?.webb
      },
      mandala: {
        ...webbTypesBundle?.spec?.mandala,
        ...typesBundle?.spec?.mandala
      }
    }
  },
  ...otherOptions
});
