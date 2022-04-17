// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { rpc as webbRpc, types as webbTypes, typesAlias as webbTypeAlias } from '@webb-tools/type-definitions';

import { DefinitionRpc, DefinitionRpcSub, OverrideBundleType, OverrideModuleType, RegistryTypes } from '@polkadot/types/types';

const types: RegistryTypes = webbTypes;

const rpc: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>> = webbRpc;

const typesAlias: Record<string, OverrideModuleType> = webbTypeAlias;

const typesBundle = {} as OverrideBundleType;

export default {
  rpc,
  types,
  typesAlias,
  typesBundle
};
