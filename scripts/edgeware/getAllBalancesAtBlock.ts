import { optionsWithEdgeware } from '@webb-tools/api';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { LoggerService } from '@webb-tools/app-util';

const ENDPOINT = 'ws://localhost:9944';
const apiLogger = LoggerService.get('Api');
const DISTRIBUTION_HASH = '0x7c3220a5589a8cf5300b5531472bafe164e1690c07d05a469b70717fe8584e8a';

async function main() {
  apiLogger.info('Connecting to ', ENDPOINT);
  const provider = new WsProvider([ENDPOINT]);
  const opts = optionsWithEdgeware({ provider });
  const api = await ApiPromise.create(opts);
  await api.isReady;

  const entries = await api.query.system.account.entriesAt(DISTRIBUTION_HASH);
  // do something with entries
  await api.disconnect();
}

main().catch(apiLogger.error);
