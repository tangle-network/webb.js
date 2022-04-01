import { JsNote, OperationError } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  catchWasmError,
  createAnchor,
  depositAnchorBnX5_4,
  KillTask,
  preparePolkadotApi,
  sleep,
  startWebbNode,
  transferBalance,
  withdrawAnchorBnx5_4,
} from '../../utils/index.js';

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

describe('Anchor tests', function () {
  this.timeout(120_000);

  before(async function () {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
  });

  it('Anchor should work', async function () {
    try {
      const { bob, charlie, alice } = getKeyring();
      // transfer some funds to sudo & test account
      console.log(`Transferring 10,000 balance to Alice and Bob`)
      await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
      // set the test account ORML balance of the mixer asset
      // await setORMLTokenBalance(apiPromise!, alice, bob, 0, 999999);
      console.log(`Creating the Anchor with size 1,000`)
      await createAnchor(apiPromise!, alice, 1000);
      let note: JsNote;
      // deposit to the mixer
      console.log(`Depositing to the Anchor`)
      note = await catchWasmError(() => depositAnchorBnX5_4(apiPromise!, bob));
      ///Give the chain sometime to insure the leaf is there
      await sleep(10_000);
      // withdraw fro the mixer
      console.log(`Withdrawing from the Anchor`)
      await catchWasmError(() =>
        withdrawAnchorBnx5_4(apiPromise!, bob, note!, bob.address)
      );
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
