<h1 align="center">Webb Tools API 🕸️ </h1>
<div align="center">
<a href="https://www.webb.tools/">
    <img alt="Webb Logo" src="./.github/assets/webb-icon.svg" width="15%" height="30%" />
  </a>
  </div>
<p align="center">
    <strong>🚀 Webb Tools API 🚀 </strong>
    <br />
    <sub> ⚠️ Beta Software ⚠️ </sub>
</p>

<div align="center" >

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/webb-tools/webb.js/PR?style=flat-square)](https://github.com/webb-tools/webb.js/actions)
[![npm](https://img.shields.io/npm/v/@webb-tools/api?logo=npm&style=flat-square)](https://www.npmjs.com/package/@webb-tools/api)
[![License Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)
[![Twitter](https://img.shields.io/twitter/follow/webbprotocol.svg?style=flat-square&label=Twitter&color=1DA1F2)](https://twitter.com/webbprotocol)
[![Telegram](https://img.shields.io/badge/Telegram-gray?logo=telegram)](https://t.me/webbprotocol)
[![Discord](https://img.shields.io/discord/833784453251596298.svg?style=flat-square&label=Discord&logo=discord)](https://discord.gg/cv8EfJu3Tn)

</div>

<!-- TABLE OF CONTENTS -->
<h2 id="table-of-contents"> 📖 Table of Contents</h2>

<details open="open">
  <summary>Table of Contents</summary>
  <ul>
    <li><a href="#start"> Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#test">Testing</a></li>
    <li><a href="#contribute">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ul>  
</details>

<h1 id="start"> Getting Started  🎉 </h1>

This library provides additional typing information for user to access Webb's modules by using [polkadot.js](https://github.com/polkadot-js/api).

For additional information, please refer to the [Webb Tools API reference docs](https://webb-tools.github.io/webb.js/) or [Webb Tools Official Documentation](https://docs.webb.tools/v1/getting-started/overview/) 📝. Have feedback on how to improve `webb.js`? Or have a specific question to ask? Checkout the [Webb Dapp Feedback Discussion](https://github.com/webb-tools/feedback/discussions/categories/webb-dapp-feedback) 💬.

<h2 id="layout"> Package layout </h2>

```
packages/
  |____api/                 # Contains necessary options to create a polkadot.js API instance.
  |____api-derive/          # Routines and helper functions utilizing webb's api package.
  |____sdk-core/            # The package provides a cleaner API to the underlying `wasm-utils`.
  |____test-utils/          # Common testing setup and helper functions.
  |____wasm-utils/          # Wasm utils for generating zero-knowledge proof and deposit notes. Consumed by `sdk-core`.
```

## Prerequisites

This repository makes use of node.js, yarn, Rust, and requires version 16. To install node.js binaries, installers, and source tarballs, please visit https://nodejs.org/en/download/. Once node.js is installed you may proceed to install [`yarn`](https://classic.yarnpkg.com/en/docs/install):

```
npm install --global yarn
```

Great! Now your **Node** environment is ready! 🚀🚀

To install Rust, we will make use of <https://rustup.rs> installer and the `rustup` tool to manage the Rust toolchain.

First install and configure `rustup`:

```bash
# Install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Configure
source ~/.cargo/env
```

Configure the Rust toolchain to default to the nightly version, add nightly and the nightly wasm target:

```bash
rustup default nightly
rustup update
rustup update nightly
```

This repository makes use of `wasm-pack` for bindings between javascript and webassembly generated from rust. Install it with:

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

Great! Now your **Rust** environment is ready! 🦀 🦀

Lastly, install 

  - [DVC](https://dvc.org/) is used for fetching large ZK files and managing them alongside git
  - [substrate.io](https://docs.substrate.io/main-docs/install/) may require additional dependencies

🚀🚀 Your environment is complete! 🚀🚀

## Installation 💻

Once the development environment is set up, you may proceed install the required dependencies. 

```bash
yarn install
```

**To build:**

```bash
yarn build
```

**To fetch fixtures:**

```bash
dvc pull
```

<h1 id="usage"> Usage </h1>

<h2 style="border-bottom:none"> Quick Start ⚡ </h2>

In order to make use of `@webb-tools/api` you will need to have a node available and running. Below we assume you have started a node locally, but you may also make use of our deployed [Tangle Network Minerva Parachain Testnet](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftangle1.webb.tools#/explorer).
#### Install package dependencies

```bash
yarn add @polkadot/api @webb-tools/api@beta
```

#### Create API instance

```ts
import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@webb-tools/api';

async function main() {
    // the node endpoint
    const provider = new WsProvider('ws://localhost:9944');
    const api = new ApiPromise(options({ provider }));
    await api.isReady;

    // use the api
    //..
}

main()
```

#### Use api to interact with node

```ts
// query and display account data
const data = await api.query.system.account('5Dqf9U5dgQ9GLqdfaxXGjpZf9af1sCV8UrnpRgqJPbe3wCwX');
console.log(data.toHuman());
```

### Usage examples

We have included implementation examples for using this API to interact with an [Anchor](./examples/node/substrate/anchor.ts) and [Mixer](./examples/node/substrate/mixer.ts). 

To run the above mentioned usage examples you will need to use the experimental module loader and start a [local substrate chain](https://github.com/webb-tools/protocol-substrate#standalone-local-testnet). In addition please ensure you have updated the fixtures by running:

```bash
dvc pull
```

Once started you may run the following command from root:

```bash
# Runs the Anchor usage example script
NODE_OPTIONS="--loader ./loader.js" node ./examples/node/substrate/anchor.ts

# Runs the Mixer usage example script
NODE_OPTIONS="--loader ./loader.js" node ./examples/node/substrate/mixer.ts
```

<h2 id="test"> Testing 🧪 </h2>

The following instructions outlines how to run webb.js API unit test suite and integration test suite.

**Note**: You will need to run `yarn build` prior to running test suite. For integration tests, a Docker daemon must also be available.

### To run all tests - unit, integration, wasm, providers

```
yarn test
```

### To run unit tests

```
yarn test:unit
```

### To run integration tests

```
yarn test:integration
```

### To run wasm tests

```
yarn test:wasm
```

### To run providers test

```
yarn test:providers
```

<h2 id="contribute"> Contributing </h2>

Interested in contributing to Webb.js? Thank you so much for your interest! We are always appreciative for contributions from the open-source community!

If you have a contribution in mind, please check out our [Contribution Guide](./.github/CONTRIBUTING.md) for information on how to do so. We are excited for your first contribution!

### Lint before you push! 🪥

Please ensure you lint and format your changes prior to opening a PR. 

**To lint:**

```
yarn lint
```

**To format:**

```
yarn format
```

<h2 id="license"> License </h2>

Licensed under <a href="LICENSE">Apache 2.0 license</a>.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in this crate by you, as defined in the Apache 2.0 license, shall be licensed as above, without any additional terms or conditions.

## Supported by

<br />
<p align="center">
 <img src=".github/assets/w3f.jpeg" width="30%" height="60%" >
</p>
