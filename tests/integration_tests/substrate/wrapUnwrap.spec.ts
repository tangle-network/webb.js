import { Keyring } from '@polkadot/keyring';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  startProtocolSubstrateNodes,
  transferBalance
} from '../../utils/index.js';
import { polkadotTx } from '@webb-tools/test-utils/index.js';
import { expect } from 'chai';
import { Option, U32 } from '@polkadot/types-codec';
import { BN } from '@polkadot/util';
let apiPromise: ApiPromise | null = null;
let nodes:any = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;

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

  const id = nextAssetId.toNumber() - 1;
  const tokenWrapperNonce = await apiPromise.query.tokenWrapper.proposalNonce<Option<U32>>(name);
  const nonce  = tokenWrapperNonce.unwrapOr(new BN(0)).toNumber() + 1;
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },
    // @ts-ignore
    [apiPromise.tx.tokenWrapper.setWrappingFee( 1,id ,nonce)], singer);
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

describe('Wrap/unwrap substrate tests', function() {
  this.timeout(220_000);
  before(async function() {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = await startProtocolSubstrateNodes();
    apiPromise = await nodes[0].api();
    const { bob, charlie, alice } = getKeyring();
    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 1000_000);
  });

  it('should wrap and unwrap for substrate', async function() {
    const name = 'WEBB^2';
    // Create the PoolShare asset
    const webSqu = await createPoolShare(apiPromise!, name, getKeyring().alice, 0);
    console.log(`${name} asset created`);
    await addAssetToPool(apiPromise! ,"0" , name, getKeyring().alice);
    console.log(`Added Asset 0 to Pool ${name}`);

    const balanceBeforeWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,webSqu);
    const wrappedTokenBalanceBeforeWrapping  = balanceBeforeWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceBeforeWrapping).to.equal(0);

    console.log(`Wrapping 1_000_000_000 ${name} tokens `);
    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method:"wrap"
    } ,["0" , webSqu , 1_000_000_000 , getKeyring().bob.address], getKeyring().bob)
    console.log(`Wrapped 1_000_000_000 ${name} tokens `);

    const balanceAfterWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,webSqu);
    const wrappedTokenBalanceAfterWrapping  = balanceAfterWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterWrapping).to.equal(1_000_000_000);


    console.log(`Unwrapping ${1_000_000_000 /2} ${name} tokens `);
    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method:"unwrap"
    } ,[webSqu  ,"0" , 1_000_000_000 /2 , getKeyring().bob.address], getKeyring().bob)
    console.log(`Unwrapped ${1_000_000_000 /2} ${name} tokens `);

    const balanceAfterUnwrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,webSqu);
    const wrappedTokenBalanceAfterUnwrapping  = balanceAfterUnwrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterUnwrapping).to.equal(1_000_000_000/2);
    console.log('DONE TESTING');
  });

  after(async function() {
    await apiPromise?.disconnect();
    await nodes[0]?.stop();
    await nodes[1]?.stop();
  });
});

