import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@webb-tools/api';
// import { Note } from '@webb-tools/sdk-core';
// import { JsNote } from '@webb-tools/wasm-utils/njs';

async function connectToLocalChain() {
    const provider = new WsProvider('wss://localhost:9944');
    const api = new ApiPromise(options({ provider }));
    await api.isReady;
    console.log((await api.rpc.system.properties()).toHuman());
  }

(async () => {
  await connectToLocalChain();
  process.exit(0);
})();