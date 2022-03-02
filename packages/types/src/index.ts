import {
  typesBundle as webbTypesBundle,
  types as webbTypes,
  typesAlias as webbTypeAlias,
  rpc as webbRpc
} from '@webb-tools/type-definitions';
import {
  OverrideBundleType,
  OverrideModuleType,
  RegistryTypes,
  DefinitionRpc,
  DefinitionRpcSub
} from '@polkadot/types/types';

/// <reference path="./interfaces/augment-api-consts.d.ts" />
/// <reference path="./interfaces/augment-api-tx.d.ts" />
/// <reference path="./interfaces/augment-api-query.d.ts" />
/// <reference path="./interfaces/augment-types.d.ts" />

export const types: RegistryTypes = webbTypes;

export const rpc: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>> = webbRpc;

export const typesAlias: Record<string, OverrideModuleType> = webbTypeAlias;

export const typesBundle = webbTypesBundle as unknown as OverrideBundleType;
