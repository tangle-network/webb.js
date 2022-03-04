import { JsNote, OperationError } from '@webb-tools/wasm-utils/njs';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import {
  catchWasmError,
  depositMixerBnX5_5,
  KillTask,
  preparePolkadotApi,
  sleep,
  startWebbNode,
  transferBalance,
  withdrawMixerBnX5_5,
} from '../../utils';

let apiPromise: ApiPromise | null = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;
let nodes: KillTask | undefined;

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
  this.timeout(120_000);

  before(async function () {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
  });

  it('Mixer should work', async function () {
    try {
      const { bob, charlie, alice } = getKeyring();
      // transfer some funds to sudo & test account
      console.log(`Transferring 10,000 balance to Alice and Bob`)
      await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
      let note: JsNote;
      // deposit to the mixer
      console.log(`Depositing to the mixer`)
      note = await catchWasmError(() => depositMixerBnX5_5(apiPromise!, bob));
      ///Give the chain sometime to insure the leaf is there
      await sleep(10_000);
      // withdraw fro the mixer
      console.log(`Withdrawing from the mixer`)
      await catchWasmError(() => withdrawMixerBnX5_5(apiPromise!, bob, note!, bob.address));
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
    await nodes?.();
  });
});
