// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { rpc as webbRpc, types as webbTypes, typesAlias as webbTypeAlias, typesBundle as webbTypesBundle } from '@webb-tools/type-definitions';

import { DefinitionRpc, DefinitionRpcSub, OverrideBundleType, OverrideModuleType, RegistryTypes } from '@polkadot/types/types';

/// <reference path="./interfaces/augment-api-consts.d.ts" />
/// <reference path="./interfaces/augment-api-tx.d.ts" />
/// <reference path="./interfaces/augment-api-query.d.ts" />
/// <reference path="./interfaces/augment-types.d.ts" />

export const types: RegistryTypes = webbTypes;

export const rpc: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>> = webbRpc;

export const typesAlias: Record<string, OverrideModuleType> = webbTypeAlias;

export const typesBundle = webbTypesBundle as unknown as OverrideBundleType;
