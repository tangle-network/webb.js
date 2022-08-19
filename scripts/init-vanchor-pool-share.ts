import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { polkadotTx } from '@webb-tools/test-utils/src/index.js';
import { Keyring } from '@polkadot/keyring';
import { preparePolkadotApi, startWebbNode, transferBalance } from '../tests/utils/index.js';
import { expect } from 'chai';

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

async function createVAnchor(apiPromise: ApiPromise, currencyId: number, singer: KeyringPair): Promise<number> {
  await polkadotTx(apiPromise, {
    section: 'sudo',
    method: 'sudo'
  }, [apiPromise.tx.vAnchorBn254.create(1, 30, currencyId)], singer);
  const nextTreeId = await apiPromise?.query.merkleTreeBn254.nextTreeId();
  // @ts-ignore
  return nextTreeId.toNumber() - 1;
};

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
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },

    // TODO remove this after types update to
    // @ts-ignore
    [apiPromise.tx.tokenWrapper.setWrappingFee(1, id, 1)], singer);
  return id;
}

async function addAssetToPool(
  apiPromise: ApiPromise,
  assetId: string,
  poolAssetId: string,
  singer: KeyringPair
) {
  await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    },
    [apiPromise.tx.assetRegistry.addAssetToPool(poolAssetId, Number(assetId))], singer);
}

async function main() {
  const nodes = startWebbNode();
  const apiPromise = await preparePolkadotApi();
  const { bob, charlie, alice } = getKeyring();
  console.log(`Transferring 1000,000 balance to Alice and Bob`);
  await transferBalance(apiPromise!, charlie, [alice, bob], 1000_000);
  try {
    const name = 'WEBB^2';
    // Create the PoolShare asset
    const webSqu = await createPoolShare(apiPromise!, name, getKeyring().alice, 0);
    console.log('WEBB^2 asset created');
    await addAssetToPool(apiPromise!, '0', name, getKeyring().alice);
    console.log('Added Asset 0 to Pool WEBB^2');

    const balanceBeforeWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address, webSqu);
    const wrappedTokenBalanceBeforeWrapping = balanceBeforeWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceBeforeWrapping).to.equal(0);

    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method: 'wrap'
    }, ['0', webSqu, 1000_000_000, getKeyring().bob.address], getKeyring().bob);

    const balanceAfterWrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address, webSqu);
    const wrappedTokenBalanceAfterWrapping = balanceAfterWrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterWrapping).to.equal(1000_000_000);

    await polkadotTx(apiPromise!, {
      section: 'tokenWrapper',
      method: 'unwrap'
    }, [webSqu, '0', 1000_000_000 / 2, getKeyring().bob.address], getKeyring().bob);

    const balanceAfterUnwrapping = await apiPromise!.query.tokens.accounts(getKeyring().bob.address, webSqu);
    const wrappedTokenBalanceAfterUnwrapping = balanceAfterUnwrapping.toJSON().free as number;
    expect(wrappedTokenBalanceAfterUnwrapping).to.equal(1000_000_000 / 2);

    const anchorId = await createVAnchor(apiPromise!, webSqu, getKeyring().alice);
    console.log(`Create anchorId ${anchorId}`);
  } finally {
      await apiPromise?.disconnect();
      console.log(nodes);

  }

}

main().catch(console.error);
