// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { options } from '@webb-tools/api';
// import { expect } from 'chai';
import { getAnchors } from '@webb-tools/api-derive';

import { ApiPromise, WsProvider } from '@polkadot/api';

describe('Bootstrap providers', function () {
  this.timeout(120_000);

  it('Should init Polkadot provider', async () => {
    const wsProvider = new WsProvider('ws://localhost:9944');
    const opts = options({ provider: wsProvider });

    const api = new ApiPromise(opts);

    await api.isReady;
    const anchors = await getAnchors(api);

    console.log(anchors);
  });
});
