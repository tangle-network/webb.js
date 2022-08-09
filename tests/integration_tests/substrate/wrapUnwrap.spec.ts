import path from 'path';
import fs from 'fs';
import { hexToU8a } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import { polkadotTx } from '@webb-tools/test-utils/index.js';

let apiPromise: ApiPromise | null = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;
let nodes: KillTask | undefined;

const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';

// @ts-ignore
function getKeys() {
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'protocol-substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-2-2',
    'proving_key_uncompressed.bin'
  );

  const vkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'protocol-substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-2-2',
    'verifying_key_uncompressed.bin'
  );
  const pk_hex = fs.readFileSync(pkPath).toString('hex');
  const pk = hexToU8a(pk_hex);
  const vk_hex = fs.readFileSync(vkPath).toString('hex');
  const vk = hexToU8a(vk_hex);
  return {
    pk,
    vk
  };
}

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
    charlie
  };
  return keyring;
}

async function createPoolShare(
  apiPromise: ApiPromise,
  name: string,
  singer:KeyringPair,
  existentialDeposit: number = 0
) {
  await polkadotTx(apiPromise, {
    section: 'assetRegistry',
    method: 'register'
  }, [name, {
      PoolShare:[0]
  }, existentialDeposit],singer);
  const nextTreeId = await apiPromise.query.assetRegistry.nextTreeId();
  // @ts-ignore
  return nextTreeId.toNumber() - 1;
}

describe.only('Wrap/unwrap tests', function() {
  this.timeout(120_000);
  before(async function() {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
    const { bob, charlie, alice } = getKeyring();
    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
  });


  it('should wrap and unwrap', async function() {
    // Create the PoolShare asset
    const webSqu  =  await createPoolShare(apiPromise!, 'WEBB^2', getKeyring().alice, 0);
    console.log(webSqu);
  });

  after(async function() {
    await apiPromise?.disconnect();
    await nodes?.();
  });
});
