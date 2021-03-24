import { options } from '@webb-tools/api';
import { timeout } from 'rxjs/operators';
import { ApiRx, WsProvider, Keyring } from '@polkadot/api';
import { LoggerService } from '@webb-tools/app-util';
import BN from 'bn.js';

const MAX_CONNECT_TIME = 1000 * 60; // one minute
const ENDPOINT = 'ws://localhost:9944';
const apiLogger = LoggerService.get('Api');

async function main() {
  apiLogger.info('Connecting to ', ENDPOINT);
  const provider = new WsProvider([ENDPOINT]);
  const opts = options({ provider });
  const api = await ApiRx.create(opts).pipe(timeout(MAX_CONNECT_TIME)).toPromise();
  const result = await api.rpc.system.chain().toPromise();
  apiLogger.info('🎉 Connected to ', result.toHuman());
  const targetAccount = process.argv[2];
  if (!targetAccount) {
    console.error('Usage: yarn script scripts/mint.ts <TARGET_ACCOUNT_ADDRESS>');
    process.exit(1);
  }
  const dem = new BN(10).pow(new BN(12));
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice', { name: 'Alice default' });
  const target = keyring.decodeAddress(targetAccount);
  const tx = await api.tx.sudo
    .sudo(api.tx.balances.setBalance(target, new BN(1_000_000).pow(dem), 0))
    .signAndSend(alice)
    .toPromise();

  apiLogger.info('TX: ', tx.toHuman());
  await api.disconnect();
}

main().catch(apiLogger.error);
