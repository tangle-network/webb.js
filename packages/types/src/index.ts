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

import './interfaces/augment-api';
import './interfaces/augment-api-consts';
import './interfaces/augment-api-query';
import './interfaces/augment-api-tx';
import './interfaces/augment-types';

export * from './interfaces/augment-api-mobx';

export const types: RegistryTypes = webbTypes;

export const rpc: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>> = webbRpc;

export const typesAlias: Record<string, OverrideModuleType> = webbTypeAlias;

export const typesBundle = (webbTypesBundle as unknown) as OverrideBundleType;
