import {
  createAnchor,
  getAnchors,
  KillTask,
  preparePolkadotApi,
  setORMLTokenBalance,
  sleep,
  startWebbNode,
  transferBalance,
} from '../utils';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;

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

let nodes: KillTask | undefined;

let apiPromise: ApiPromise | null = null;

async function main() {
  try {
    nodes = startWebbNode();
    await sleep(2000);
    apiPromise = await preparePolkadotApi();
    const { bob, charlie, alice } = getKeyring();
    // transfer some funds to sudo & test account
    await transferBalance(apiPromise!, charlie, [alice, bob]);
    // set the test account ORML balance of the mixer asset
    await setORMLTokenBalance(apiPromise!, alice, bob);
    await createAnchor(apiPromise!, alice, 100);

    const anchors = await getAnchors(apiPromise!);
    console.log(anchors);
  } finally {
    await apiPromise?.disconnect();
    nodes?.();
  }
}

main()
  .then(() => console.log('done'))
  .catch(console.error);
