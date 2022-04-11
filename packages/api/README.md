# @webb-tools/api

Contains necessary options and types to create a polkadot.js API instance

```ts
import {ApiPromise, WsProvider} from "@polkadot/api";

const wsProvider: wsProvider = WsProvider('ws://127.0.0.1:9944');

const options = options({
  provider: wsProvider
});

const apiPromise = ApiPromise.create(options)
```
