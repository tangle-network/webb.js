import { optionsWithEdgeware } from '@webb-tools/api';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { LoggerService } from '@webb-tools/app-util';

const ENDPOINT = 'ws://localhost:9944';
const apiLogger = LoggerService.get('Api');

async function main() {
  apiLogger.info('Connecting to ', ENDPOINT);
  const provider = new WsProvider([ENDPOINT]);
  const opts = optionsWithEdgeware({ provider });
  const api = await ApiPromise.create(opts);
  await api.isReady;
  const result = await api.rpc.system.chain();
  apiLogger.info('🎉 Connected to ', result.toHuman());
  const props = await api.rpc.system.properties();
  apiLogger.info('Network Properties: ', props.toHuman());
  await api.disconnect();
}

main().catch(apiLogger.error);
