import { Keyring } from '@polkadot/keyring';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  startProtocolSubstrateNodes,
  transferBalance
} from '../../utils/index.js';
import { polkadotTx, LocalProtocolSubstrate } from '@webb-tools/test-utils/index.js';
import { expect } from 'chai';
import { Option, U32 } from '@polkadot/types-codec';
import { BN } from '@polkadot/util';
let apiPromise: ApiPromise | null = null;
let nodes: LocalProtocolSubstrate[];
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

async function RegisterTokenAsset(
  apiPromise: ApiPromise,
  name: string,
  singer: KeyringPair,
  existentialDeposit: number = 0
) {
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },
    [apiPromise.tx.assetRegistry.register(name,"Token",existentialDeposit)], singer);
  const nextAssetId = await apiPromise.query.assetRegistry.nextAssetId();

  const id = nextAssetId.toNumber() - 1;
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
  this.timeout(300_000);
  before(async function() {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = await startProtocolSubstrateNodes();
    apiPromise = await nodes[0].api();
    const { bob, charlie, alice } = getKeyring();
    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 1000000);
  });

  it('should wrap and unwrap for substrate', async function() {
    const POOL_SHARE_NAME = 'WebbTNT';
    const TOKEN_NAME = 'TNT';
    const BALANCE = 1000000;
    const EXISTENTIAL_DEPOSIT = 0;
    // Register new Asset for TNT token.
    const assetId = await RegisterTokenAsset(apiPromise!,TOKEN_NAME,getKeyring().alice, EXISTENTIAL_DEPOSIT);
    console.log(`${TOKEN_NAME} token asset created.`);
    // Register new asset for WebbTNT PoolShare.
    const poolShareId = await createPoolShare(apiPromise!, POOL_SHARE_NAME, getKeyring().alice, EXISTENTIAL_DEPOSIT);
    console.log(`${POOL_SHARE_NAME} pool share asset created.`);
    await addAssetToPool(apiPromise! ,assetId.toString() , POOL_SHARE_NAME, getKeyring().alice);
    console.log(`Added Asset ${TOKEN_NAME} to Pool ${POOL_SHARE_NAME}`);


    await polkadotTx(apiPromise!, {
      section: 'sudo',
      method: 'sudo'
    } ,
    [apiPromise?.tx.currencies.updateBalance(getKeyring().bob.address, assetId, BALANCE)], getKeyring().alice);
    apiPromise?.tx.currencies
    const webbTokenBalance = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,assetId);
    const webbTokenBalanceBefore  = webbTokenBalance.toJSON().free as number;
    expect(webbTokenBalanceBefore).to.equal(BALANCE);

    
    const balanceBeforeWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,poolShareId);
    const wrappedTokenBalanceBeforeWrapping  = balanceBeforeWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceBeforeWrapping).to.equal(0);

    console.log(`Wrapping 100000 ${POOL_SHARE_NAME} tokens `);
    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method:"wrap"
    } ,[assetId , poolShareId , 100000 , getKeyring().bob.address], getKeyring().bob)
    console.log(`Wrapped 100000 ${POOL_SHARE_NAME} tokens `);

    const balanceAfterWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,poolShareId);
    const wrappedTokenBalanceAfterWrapping  = balanceAfterWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterWrapping).to.equal(100000);


    console.log(`Unwrapping ${100000 /2} ${POOL_SHARE_NAME} tokens `);
    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method:"unwrap"
    } ,[poolShareId  ,assetId , 100000 /2 , getKeyring().bob.address], getKeyring().bob)
    console.log(`Unwrapped ${100000 /2} ${POOL_SHARE_NAME} tokens `);

    const balanceAfterUnwrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address,poolShareId);
    const wrappedTokenBalanceAfterUnwrapping  = balanceAfterUnwrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterUnwrapping).to.equal(100000/2);
    console.log('DONE TESTING');
  });

  after(async function() {
    await apiPromise?.disconnect();
    await nodes[0]?.stop();
    await nodes[1]?.stop();
  });
});

