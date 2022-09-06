import { JsNote, OperationError } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import isCi from 'is-ci';

import {
  catchWasmError,
  depositMixerBnX5_3,
  //KillTask,
  //preparePolkadotApi,
  sleep,
  //startWebbNode,
  transferBalance,
  withdrawMixerBnX5_3,
} from '../../utils/index.js';
import {LocalProtocolSubstrate, UsageMode} from "@webb-tools/test-utils";
import path from "path";

let apiPromise: ApiPromise | null = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;
//let nodes: KillTask | undefined;

const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';

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
  this.timeout(120_000);
  const usageMode: UsageMode = isCi
    ? { mode: 'docker', forcePullImage: false }
    : {
      mode: 'host',
      nodePath: path.resolve(
        '../../protocol-substrate/target/release/webb-standalone-node'
      ),
    };

  let aliceNode: LocalProtocolSubstrate;
  let bobNode: LocalProtocolSubstrate;

  before(async function () {
    aliceNode = await LocalProtocolSubstrate.start({
      name: 'substrate-alice',
      authority: 'alice',
      usageMode,
      ports: 'auto',
    });

    bobNode = await LocalProtocolSubstrate.start({
      name: 'substrate-bob',
      authority: 'bob',
      usageMode,
      ports: 'auto',
    });
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    //nodes = startWebbNode();
    //apiPromise = await preparePolkadotApi();
    apiPromise = await aliceNode.api();
  });

  it.only('Mixer should work', async function () {
    try {
      const { bob, charlie, alice } = getKeyring();
      // transfer some funds to sudo & test account
      console.log(`Transferring 10,000 balance to Alice and Bob`);
      await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
      let note: JsNote;
      // deposit to the mixer
      console.log(`Depositing to the mixer`);
      note = await catchWasmError(() => depositMixerBnX5_3(apiPromise!, bob));
      ///Give the chain sometime to insure the leaf is there
      await sleep(10_000);
      // withdraw fro the mixer
      console.log(`Withdrawing from the mixer`);
      await catchWasmError(() => withdrawMixerBnX5_3(apiPromise!, bob, note!, bob.address));
    } catch (e) {
      if (e instanceof OperationError) {
        const errorMessage = {
          code: e.code,
          errorMessage: e.error_message,
          data: e.data,
        };
        console.log(errorMessage);
        throw errorMessage;
      } else {
        throw e;
      }
    }
  });

  after(async function () {
    await aliceNode?.stop();
    await bobNode?.stop();
    //await apiPromise?.disconnect();
    //await nodes?.();
  });
});
