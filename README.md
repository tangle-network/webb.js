![license](https://img.shields.io/badge/License-Apache%202.0-blue?logo=apache&style=flat-square)
[![npm](https://img.shields.io/npm/v/@webb-tools/api?logo=npm&style=flat-square)](https://www.npmjs.com/package/@webb-tools/api)

# @webb-tools

This library provides additional typing information for user to access Webb Network by using [polkadot.js](https://github.com/polkadot-js/api).

# Getting Started

More documentation and examples on [wiki](https://github.com/webb-tools/webb.js/wiki).

- Install dependencies

```bash
yarn add @polkadot/api @webb-tools/api@beta
```

- Create API instance

```ts
import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@webb-tools/api';

async function main() {
    const provider = new WsProvider('wss://testnet-node-1.acala.laminar.one/ws');
    const api = new ApiPromise(options({ provider }));
    await api.isReady;

    // use api
}

main()
```

- Use api to interact with node

```ts
// query and display account data
const data = await api.query.system.account('5F98oWfz2r5rcRVnP9VCndg33DAAsky3iuoBSpaPUbgN9AJn');
console.log(data.toHuman())
```

# Packages

- [api](./packages/api)
  - Contains necessary options to create a polkadot.js API instance
- [app-util](./packages/app-util)
  - Utilities to work with Webb Network
- [types](./packages/types)
  - Polkadot.js type definations for Webb Network
