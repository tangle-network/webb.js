// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { jsonrpcFromDefs, typesAliasFromDefs, typesFromDefs } from '@open-web3/orml-type-definitions/utils';

import merkle from './merkle';

// FIXME: currently we cannot override this in runtime definations because the code generation script cannot handle overrides
// This will make it behave correctly in runtime, but wrong types in TS defination.
const additionalOverride = {
  Keys: 'SessionKeys3'
};

const webbDefs = {
  merkle
};

export const types = {
  ...typesFromDefs(webbDefs),
  ...additionalOverride
};

export const rpc = jsonrpcFromDefs(webbDefs, {});
export const typesAlias = typesAliasFromDefs(webbDefs, {});

const bundle = {
  alias: typesAlias,
  types: types
};

// Type overrides have priority issues
export const typesBundleForPolkadot = {
  spec: {
    webb: bundle
  }
};
