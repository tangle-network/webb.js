import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';

let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;

export function getKeyring () {
  if (keyring) {
    return keyring;
  }

  const k = new Keyring({ type: 'sr25519' });
  const bob = k.addFromMnemonic(BOBPhrase);
  const alice = k.addFromUri('//Alice');
  const charlie = k.addFromUri('//Charlie');

  keyring = {
    alice,
    bob,
    charlie
  };

  return keyring;
}

export function createAccount (accountId: string): any {
  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromUri(accountId);

  return account;
}
