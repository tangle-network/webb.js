import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@webb-tools/api';

describe('Events Playground', () => {
  // This is just for local testing purposes
  test.skip('traverse to events', async () => {
    const provider = new WsProvider('ws://localhost:9944');
    const api = new ApiPromise(options({ provider }));
    await api.isReady;
    api.query.system.events((e) => {
      console.log(`Recieved #{} events`, e.length);
      e.forEach((record) => {
        console.log(record.toHuman());
      });
    });
  });
});
