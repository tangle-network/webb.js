// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { Web3Provider, WebbCurrencyId, WebbRelayerBuilder, WebbWeb3Provider } from '@webb-tools/api-providers/index.js';
import { startGanacheServer } from '@webb-tools/test-utils/startGanacheServer.js';
import { getChainIdType } from '@webb-tools/utils';
import { expect } from 'chai';
import { ethers } from 'ethers';

// import { ethers } from 'ethers';
import { initPolkadotProvider } from './utils/init-polkadot-provider.js';
import { mockAppConfig } from './utils/mock-config.js';
import mockNotificationHandler from './utils/mock-notification-handler.js';

describe('Bootstrap providers', function () {
  this.timeout(120_000);

  // This test assumes a node is running at localhost - but this interferes with
  // integration tests run through docker.
  it.skip('Should init Polkadot provider', async () => {
    const provider = await initPolkadotProvider();
    const chainProperties = await provider.api.rpc.system.properties();

    expect(chainProperties).not.equal(null);
  });
});

describe.skip('Note provider interactions', () => {
  let provider: WebbWeb3Provider;
  const testPrivateKey = '0x0000000000000000000000000000000000000000000000000000000000000001';
  const chainId = getChainIdType(9999);

  before(async () => {
    const server = await startGanacheServer(9999, 9999, [{
      balance: ethers.utils.parseEther('1000').toHexString(),
      secretKey: testPrivateKey
    }]);

    console.log(server.status);

    const web3Provider = Web3Provider.fromUri('http://localhost:9999');

    const builder = await WebbRelayerBuilder.initBuilder(
      [{
        endpoint: 'http://localhost:9955'
      }],
      (name, basedOn) => {
        console.log(name, basedOn);

        return null;
      },
      mockAppConfig
    );

    provider = await WebbWeb3Provider.init(web3Provider, 9999, builder, mockAppConfig, mockNotificationHandler);
    // set an active bridge (which will set active currency) on the provider
    provider.methods.anchorApi.setActiveBridge(mockAppConfig.bridgeByAsset[WebbCurrencyId.webbDEV]);

    // busy wait until it is set
  });

  it('should generate a note for the fixed anchor', async () => {
    const testGeneratedNote = await provider.methods.fixedAnchor.deposit.inner.generateBridgeNote(
      'Bridge=1@Webb Development Token',
      chainId
    );

    console.log(testGeneratedNote.note.serialize());
    // const parsedNote = await testGeneratedNote.note.toDepositNote();
  });

  it('should generate a note for the variable anchor', async () => {
    const testGeneratedNote = await provider.methods.variableAnchor.deposit.inner.generateBridgeNote(
      '',
      chainId,
      2
    );

    console.log(testGeneratedNote.note.serialize());
    // const parsedNote = await testGeneratedNote.note.toDepositNote();
  });
});
