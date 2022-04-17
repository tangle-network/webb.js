// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/ban-ts-comment */
/* @ts-ignore */

import fs from 'fs';

import { generateDefaultConsts } from '@polkadot/typegen/generate/consts';
import { generateInterfaceTypes } from '@polkadot/typegen/generate/interfaceRegistry';
import { generateDefaultQuery } from '@polkadot/typegen/generate/query';
import { generateTsDef } from '@polkadot/typegen/generate/tsDef';
import { generateDefaultTx } from '@polkadot/typegen/generate/tx';
import { registerDefinitions } from '@polkadot/typegen/util';
import { Metadata } from '@polkadot/types';
import { TypeRegistry } from '@polkadot/types/create';
import * as defaultDefinitions from '@polkadot/types/interfaces/definitions';

import * as webbDefinitions from '../src/interfaces/definitions.js';
import metaHex from '../src/metadata/static-latest.js';

// Only keep our own modules to avoid confllicts with the one provided by polkadot.js
// TODO: make an issue on polkadot.js
function filterModules (names: string[], defs: any): `0x${string}` {
  const registry = new TypeRegistry();

  registerDefinitions(registry, defs);
  const metadata = new Metadata(registry, metaHex);

  // hack https://github.com/polkadot-js/api/issues/2687#issuecomment-705342442
  metadata.asLatest.toJSON();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const filtered = metadata.toJSON() as any;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  filtered.metadata.v14.pallets = filtered?.metadata?.v14?.pallets?.filter(({ name }: any) => {
    console.log(name);

    return names.includes(name);
  });

  return new Metadata(registry, filtered).toHex();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { runtime, ...substrateDefinitions } = defaultDefinitions;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const definitions = {
  '@polkadot/types/interfaces': substrateDefinitions,
  '@webb-tools/types/interfaces': webbDefinitions
} as any;

const metadata = filterModules(
  [
    'AnchorBn254',
    'AnchorBls381',
    'AnchorHandler',
    'bridge',
    'Hasher',
    'MixerBn254',
    'MixerBls381',
    'AssetRegistry',
    'Verifier',
    'Tokens'
  ],
  definitions
);
const augmentApiIndex = `
/* eslint-disable */
/// <reference path="./augment-api-consts.d.ts" />
/// <reference path="./augment-api-tx.d.ts" />
/// <reference path="./augment-api-query.d.ts" />
/// <reference path="./augment-types.d.ts" />
`.trim();

generateTsDef(definitions, 'packages/types/src/interfaces', '@webb-tools/types/interfaces');
generateInterfaceTypes(definitions, 'packages/types/src/interfaces/augment-types.d.ts');
generateDefaultConsts('packages/types/src/interfaces/augment-api-consts.d.ts', metadata, definitions);

generateDefaultTx('packages/types/src/interfaces/augment-api-tx.d.ts', metadata, definitions);
generateDefaultQuery('packages/types/src/interfaces/augment-api-query.d.ts', metadata, definitions);

fs.writeFileSync('packages/types/src/interfaces/augment-api.d.ts', augmentApiIndex);
