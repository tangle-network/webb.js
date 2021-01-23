import { jsonrpcFromDefs, typesAliasFromDefs, typesFromDefs } from '@open-web3/orml-type-definitions/utils';

import mixer from './mixer';
import versioned from './types-known/versioned';

// FIXME: currently we cannot override this in runtime definations because the code generation script cannot handle overrides
// This will make it behave correctly in runtime, but wrong types in TS defination.
const additionalOverride = {
  Keys: 'SessionKeys2'
};

const webbDefs = {
  mixer
};

export const types = {
  ...typesFromDefs(webbDefs),
  ...additionalOverride
};

export const typesBundle = {
  spec: {
    webb: {
      types: versioned
    }
  }
};

export const rpc = jsonrpcFromDefs(webbDefs, {});
export const typesAlias = typesAliasFromDefs(webbDefs, {});

const bundle = {
  types: [...versioned].map((version) => {
    return {
      minmax: version.minmax,
      types: {
        ...types,
        ...version.types
      }
    };
  }),
  alias: typesAlias
};

// Type overrides have priority issues
export const typesBundleForPolkadot = {
  spec: {
    webb: bundle
  }
};
