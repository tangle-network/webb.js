import path from 'path';
import fs from 'fs';
import { hexToU8a } from '@polkadot/util';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import { polkadotTx } from '@webb-tools/test-utils/index.js';
import { expect } from 'chai';

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
  singer: KeyringPair,
  existentialDeposit: number = 0
) {
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },
    [apiPromise.tx.assetRegistry.register(name, {
      PoolShare: [0]
    }, existentialDeposit)], singer);
  const nextAssetId = await apiPromise.query.assetRegistry.nextAssetId();
  // @ts-ignore
  const id = nextAssetId.toNumber() - 1;
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },
    [apiPromise.tx.tokenWrapper.setWrappingFee( 1,id)], singer);
  return id;
}

async function addAssetToPool(
  apiPromise: ApiPromise,
  assetId:string,
  poolAssetId:string,
  singer: KeyringPair,

){
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },
    [apiPromise.tx.assetRegistry.addAssetToPool(poolAssetId,Number(assetId))], singer);
}

describe.only('Wrap/unwrap tests', function() {
  this.timeout(120_000);
  before(async function() {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
    const { bob, charlie, alice } = getKeyring();
    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 1000_000);
  });

  it('should wrap and unwrap', async function() {
    const name = 'WEBB^2';
    // Create the PoolShare asset
    const webSqu = await createPoolShare(apiPromise!, name, getKeyring().alice, 0);
    console.log('WEBB^2 asset created');
    await addAssetToPool(apiPromise! ,"0" , name, getKeyring().alice);
    console.log('Added Asset 0 to Pool WEBB^2');

    const balanceBeforeWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,webSqu);
    const wrappedTokenBalanceBeforeWrapping  = balanceBeforeWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceBeforeWrapping).to.equal(0);

    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method:"wrap"
    } ,["0" , webSqu , 1_000_000_000 , getKeyring().bob.address], getKeyring().bob)

    const balanceAfterWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,webSqu);
    const wrappedTokenBalanceAfterWrapping  = balanceAfterWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterWrapping).to.equal(1_000_000_000);

    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method:"unwrap"
    } ,[webSqu  ,"0" , 1_000_000_000 /2 , getKeyring().bob.address], getKeyring().bob)

    const balanceAfterUnwrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,webSqu);
    const wrappedTokenBalanceAfterUnwrapping  = balanceAfterUnwrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterUnwrapping).to.equal(1_000_000_000/2);
  });

  after(async function() {
    await apiPromise?.disconnect();
    await nodes?.();
  });
});
