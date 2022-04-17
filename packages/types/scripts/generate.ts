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
import * as defaultDefinitions from '@polkadot/types/interfaces/definitions';

import * as webbDefinitions from '../src/interfaces/definitions.js';
import metadata from '../src/metadata/static-latest.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { runtime: _runtime, ...ormlModulesDefinitions } = ormlDefinitions;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { runtime, ...substrateDefinitions } = defaultDefinitions;

const defs = webbDefinitions;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const definitions = {
  '@open-web3/orml-types/interfaces': ormlModulesDefinitions,
  '@polkadot/types/interfaces': substrateDefinitions,
  '@webb-tools/types/interfaces': defs
} as any;

generateTsDef(definitions, 'packages/types/src/interfaces', '@webb-tools/types/interfaces');
generateInterfaceTypes(definitions, 'packages/types/src/interfaces/augment-types.ts');
generateDefaultConsts('packages/types/src/interfaces/augment-api-consts.ts', metadata, definitions, false);

generateDefaultTx('packages/types/src/interfaces/augment-api-tx.ts', metadata, definitions, false);
generateDefaultQuery('packages/types/src/interfaces/augment-api-query.ts', metadata, definitions, false);
generateDefaultRpc('packages/types/src/interfaces/augment-api-rpc.ts', definitions);
