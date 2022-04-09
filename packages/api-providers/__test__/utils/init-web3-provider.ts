// // Copyright 2022 @webb-tools/
// // SPDX-License-Identifier: Apache-2.0

// import { WebbWeb3Provider } from '@webb-tools/api-providers';
// import { Account, AccountsAdapter, NotificationPayload, PromiseOrT, RelayerConfig, relayerNameToChainId, WebbPolkadot, WebbRelayerBuilder } from '@webb-tools/api-providers/index.js';
// import { Eth } from 'web3-eth';
// import { Web3Accounts } from '@webb-tools/api-providers';

// import { mockAppConfig } from './mock-config.js';

// const relayerConfig: RelayerConfig[] = [
//   {
//     endpoint: 'http://localhost:9955'
//   },
//   {
//     endpoint: 'https://relayer.nepoche.com'
//   },
//   {
//     endpoint: 'https://relayer.webb.tools'
//   },
//   {
//     endpoint: 'https://webb.pops.one'
//   },
//   {
//     endpoint: 'https://relayer.bldnodes.org'
//   }
// ];

// const notificationHandler = (m: NotificationPayload) => {
//   console.log(m);

//   return Math.random();
// };

// notificationHandler.remove = (id: string | number) => {
//   console.log(id);
// };

// export async function initWeb3Provider(): Promise<WebbWeb3Provider> {

//   WebbWeb3Provider.initWithCustomAccountAdapter(
    
//   )

// }
