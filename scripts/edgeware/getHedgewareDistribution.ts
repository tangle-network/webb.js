import { optionsWithEdgeware } from '@webb-tools/api';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountInfo, AccountData } from '@polkadot/types/interfaces';
import { LoggerService } from '@webb-tools/app-util';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import fs from 'fs';

// set bignumber configuration for correct calculations
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN });
BigNumber.config({ DECIMAL_PLACES: 0 });

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
  let quadSum = new BN('0');
  // get sums and square root sums
  entries.forEach((entry) => {
    const accountInfo: AccountInfo = entry[1];
    const accountData: AccountData = accountInfo.data;
    // sum free + reserved
    const accountBalance = new BN(accountData.free.toString()).add(new BN(accountData.reserved.toString()));
    // take sqrt
    const sqrtOfBalance = new BigNumber(accountBalance.toString()).sqrt();
    // add values to sum
    quadSum = quadSum.add(new BN(sqrtOfBalance.toString()));
  });

  let totalDistributed = new BN('0');
  const distribution = entries.map((entry) => {
    const accountInfo: AccountInfo = entry[1];
    const accountData: AccountData = accountInfo.data;
    // sum free + reserved
    const accountBalance = new BN(accountData.free.toString()).add(new BN(accountData.reserved.toString()));
    // take sqrt
    const sqrtOfBalance = new BigNumber(accountBalance.toString()).sqrt();
    // weight properly for distribution
    const quadraticAllocation = new BN(sqrtOfBalance.toString())
      // multiply by 2,500,000 tokens w/ 18 decimals -> 24 zeros
      .mul(new BN('2500000000000000000000000'))
      .div(quadSum);

    totalDistributed = totalDistributed.add(quadraticAllocation);
    return [entry[0].toString().substr(entry[0].toString().length - 64), quadraticAllocation.toString()];
  });

  fs.writeFileSync('./distribution.json', JSON.stringify({ balances: distribution }, null, 4));
  console.log('Total distributed', totalDistributed.toString());
  await api.disconnect();
}

main().catch(apiLogger.error);
