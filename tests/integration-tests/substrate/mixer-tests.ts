import {JsNote, Proof} from '@webb-tools/wasm-utils/njs/wasm-utils';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import { ChildProcessWithoutNullStreams } from 'child_process';
import WebSocket from 'ws';
import {
  depositMixerBnX5_5,
  preparePolkadotApi,
  setORMLTokenBalance,
  transferBalance,
  withdrawMixerBnX5_5,
} from '../../utils/substrate-utils';
import {KillTask, startDarkWebbNode} from "../../utils/backend-utils";
import {sleep} from "../../utils";

let apiPromise: ApiPromise | null = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;
let relayer: ChildProcessWithoutNullStreams;
let nodes: KillTask | undefined;
let relayerEndpoint: string;


let client: WebSocket;

const BOBPhrase =
  'asthma early danger glue satisfy spatial decade wing organ bean census announce';

function getKeyring() {
  if (keyring) {
    return keyring;
  }
  const k = new Keyring({ type: 'sr25519' });
  const bob = k.addFromMnemonic(BOBPhrase);
  const alice = k.addFromUri('//Alice');
  const charlie = k.addFromUri('//Charlie');
  keyring = {
    bob,
    alice,
    charlie,
  };
  return keyring;
}

describe('Mixer tests', function () {
  // increase the timeout for relayer tests
  this.timeout(120_000);

  before(async function () {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    if (process.env.LOCAL_NODE !== 'ture') {
      nodes = startDarkWebbNode();
    }


    apiPromise = await preparePolkadotApi();

    client = new WebSocket(`${relayerEndpoint.replace('http', 'ws')}/ws`);
    await new Promise((resolve) => client.on('open', resolve));
    console.log('Connected to Relayer!');
  });

  it('should relay successfully', async function () {
    const { bob, charlie, alice } = getKeyring();
    // transfer some funds to sudo & test account
    await transferBalance(apiPromise!, charlie, [alice, bob]);
    // set the test account ORML balance of the mixer asset
    await setORMLTokenBalance(apiPromise!, alice, bob);

    let note: JsNote;
    // deposit to the mixer
    note = await depositMixerBnX5_5(apiPromise!, bob);
    ///Give the chain sometime to insure the leaf is there
    await sleep(10_000);
    // withdraw fro the mixer
    const hash = await withdrawMixerBnX5_5(
      apiPromise!,
      bob,
      note!,
      bob.address
    );
  console.log(hash);
  });

  after(function () {
    client?.terminate();
    relayer.kill('SIGINT');
    nodes?.();
  });
});
