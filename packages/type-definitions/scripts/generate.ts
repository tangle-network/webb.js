// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { rpc, types, typesBundleForPolkadot } from '@webb-tools/type-definitions/index.js';
import fs from 'fs';

fs.writeFileSync('packages/type-definitions/src/json/types.json', JSON.stringify(types, null, 4));
fs.writeFileSync(
  'packages/type-definitions/src/json/typesBundle.json',
  JSON.stringify(typesBundleForPolkadot, null, 4)
);
fs.writeFileSync('packages/type-definitions/src/json/rpc.json', JSON.stringify(rpc, null, 4));
