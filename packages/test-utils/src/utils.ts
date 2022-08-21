// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { options } from '@webb-tools/api/index.js';
import { ResourceId } from '@webb-tools/sdk-core/proposals/resourceId';
import { BigNumber } from 'ethers';

import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { Bytes, Option } from '@polkadot/types';

type MethodPath = {
  section: string;
  method: string;
};

export function currencyToUnitI128 (currencyAmount: number) {
  const bn = BigNumber.from(currencyAmount);

  return bn.mul(1_000_000_000_000);
}

export function polkadotTx (api: ApiPromise, path: MethodPath, params: any[], signer: KeyringPair) {
  // @ts-ignore
  const tx = api.tx[path.section][path.method](...params);

  return new Promise<string>((resolve, reject) => {
    tx.signAndSend(signer, (result) => {
      const status = result.status;
      const events = result.events.filter(({ event: { section } }) => section === 'system');

      if (status.isInBlock || status.isFinalized) {
        for (const event of events) {
          const { event: { data, method } } = event;
          const [dispatchError] = data as any;

          if (method === 'ExtrinsicFailed') {
            let message = dispatchError.type;

            if (dispatchError.isModule) {
              try {
                const mod = dispatchError.asModule;
                const error = dispatchError.registry.findMetaError(mod);

                message = `${error.section}.${error.name}`;
              } catch (error) {
                reject(message);
              }
            } else if (dispatchError.isToken) {
              message = `${dispatchError.type}.${dispatchError.asToken.type}`;
            }

            reject(message);
          } else if (method === 'ExtrinsicSuccess') {
            resolve(tx.hash.toString());
          }
        }
      }
    }).catch((e) => reject(e));
  });
}

export async function createLocalPolkadotApi () {
  const wsProvider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create(
    options({
      provider: wsProvider
    })
  );

  return api.isReady;
}

export async function transferBalance (
  api: ApiPromise,
  source: KeyringPair,
  receiverPairs: KeyringPair[],
  number = 1000
) {
  // transfer to alice
  for (const receiverPair of receiverPairs) {
    await polkadotTx(
      api,
      // eslint-disable-next-line sort-keys
      { section: 'balances', method: 'transfer' },
      [receiverPair.address, currencyToUnitI128(number).toString()],
      source
    );
  }
}

export async function fetchRPCTreeLeaves (api: ApiPromise, treeId: string | number): Promise<Uint8Array[]> {
  let done = false;
  let from = 0;
  let to = 511;
  const leaves: Uint8Array[] = [];

  while (done === false) {
    const treeLeaves: any[] = await (api.rpc as any).mt.getLeaves(treeId, from, to);

    if (treeLeaves.length === 0) {
      done = true;
      break;
    }

    leaves.push(...treeLeaves.map((i) => i.toU8a()));
    from = to;
    to = to + 511;
  }

  return leaves;
}

export async function registerResourceId (api: ApiPromise, resourceId: ResourceId) {
  // quick check if the resourceId is already registered
  const res = await api.query.dKGProposals.resources(resourceId);
  const val = new Option(api.registry, Bytes, res);

  if (val.isSome) {
    console.log(`Resource id ${resourceId} is already registered, skipping`);

    return;
  }

  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  const call = api.tx.dKGProposals.setResource(resourceId, '0x00');

  console.log('Registering resource id');
  const unsub = await api.tx.sudo
    .sudo(call)
    .signAndSend(alice, ({ events = [], status }) => {
      console.log(`Current status is: ${status.type}`);

      if (status.isFinalized) {
        console.log(`Transaction included at blockHash ${status.asFinalized}`);

        events.forEach(({ event: { data, method, section }, phase }) => {
          console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        });

        unsub();
      }
    });
}
