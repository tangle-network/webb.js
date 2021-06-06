import { optionsWithEdgeware } from '@webb-tools/api';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountInfo, AccountData } from '@polkadot/types/interfaces';
import { LoggerService } from '@webb-tools/app-util';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import fs from 'fs';

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
  let sum = new BN('0');
  let quadSum = new BN('0');
  // get sums and square root sums
  entries.forEach((entry) => {
    const accountInfo: AccountInfo = entry[1];
    const accountData: AccountData = accountInfo.data;
    const sqrtOfFree = new BigNumber(accountData.free.toString()).sqrt();
    // add values to sum
    sum = sum.add(accountData.free);
    quadSum = quadSum.add(new BN(sqrtOfFree.toString()));
  });

  const distribution = entries.map((entry) => {
    const accountInfo: AccountInfo = entry[1];
    const accountData: AccountData = accountInfo.data;
    const sqrtOfFree = new BigNumber(accountData.free.toString()).sqrt();
    const quadraticAllocation = new BN(sqrtOfFree.toString())
      // multiply by 5,000,000 tokens w/ 18 decimals -> 24 zeros
      .mul(new BN('5000000000000000000000000'))
      .div(quadSum);

    return [entry[0].toString().substr(entry[0].toString().length - 64), quadraticAllocation.toString()];
  });

  fs.writeFileSync('./distribution.json', JSON.stringify({ balances: distribution }, null, 4));
  await api.disconnect();
}

main().catch(apiLogger.error);
