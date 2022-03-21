import { initPolkadotProvider } from './utils/init-polkadot-provider';

describe('Bootstrap providers', () => {
  test('Should init Polkadot provider', async () => {
    const provider = await initPolkadotProvider();
    const chainProperties = await provider.api.rpc.system.properties();
    console.log(chainProperties);
  });
});
