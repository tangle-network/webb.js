import { optionsWithEdgeware } from '@webb-tools/api';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { LoggerService } from '@webb-tools/app-util';

const ENDPOINT = 'ws://localhost:9944';
const apiLogger = LoggerService.get('Api');
const inputSubstrateAddress = process.argv[2];

async function main() {
    apiLogger.info('Connecting to ', ENDPOINT);
    const provider = new WsProvider([ENDPOINT]);
    const opts = optionsWithEdgeware({ provider });
    const api = await ApiPromise.create(opts);
    await api.isReady;
    let systemAccount = await api.query.system.account(inputSubstrateAddress);
    apiLogger.info('Balance of account is: ' + systemAccount.data);
    await api.disconnect();
}

main().catch(apiLogger.error);
