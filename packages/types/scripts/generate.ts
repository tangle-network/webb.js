// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/ban-ts-comment */
/* @ts-ignore */

import * as ormlDefinitions from '@open-web3/orml-types/interfaces/definitions';

// import fs from 'fs';
import { generateDefaultConsts, generateDefaultQuery, generateDefaultRpc, generateDefaultTx } from '@polkadot/typegen/generate';
import { generateInterfaceTypes } from '@polkadot/typegen/generate/interfaceRegistry';
import { generateTsDef } from '@polkadot/typegen/generate/tsDef';
// import { registerDefinitions } from '@polkadot/typegen/util';
import { Metadata, TypeRegistry } from '@polkadot/types';
import * as defaultDefinitions from '@polkadot/types/interfaces/definitions';

import * as webbDefinitions from '../src/interfaces/definitions.js';
import metaHex from '../src/metadata/static-latest.js';

function filterModules (names: string[], defs: any): `0x${string}` {
  const registry = new TypeRegistry();

  // registerDefinitions(registry, defs);
  const metadata = new Metadata(registry, metaHex);

  // hack https://github.com/polkadot-js/api/issues/2687#issuecomment-705342442
  metadata.asLatest.toJSON();

  const filtered = metadata.toJSON() as any;

  return new Metadata(registry, filtered).toHex();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { runtime: _runtime, ...ormlModulesDefinitions } = ormlDefinitions;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { runtime, ...substrateDefinitions } = defaultDefinitions;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const definitions = {
  '@open-web3/orml-types/interfaces': ormlModulesDefinitions,
  '@polkadot/types/interfaces': substrateDefinitions,
  '@webb-tools/types/interfaces': webbDefinitions
} as any;

const metadata = filterModules([], null);

generateTsDef(definitions, 'packages/types/src/interfaces', '@webb-tools/types/interfaces');
generateInterfaceTypes(definitions, 'packages/types/src/interfaces/augment-types.ts');
generateDefaultConsts('packages/types/src/interfaces/augment-api-consts.ts', metadata, definitions);

generateDefaultTx('packages/types/src/interfaces/augment-api-tx.ts', metadata, definitions);
generateDefaultQuery('packages/types/src/interfaces/augment-api-query.ts', metadata, definitions);
generateDefaultRpc('packages/types/src/interfaces/augment-api-rpc.ts', definitions);
