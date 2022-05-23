// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import ganache from 'ganache';

export type GanacheAccounts = {
  balance: string;
  secretKey: string;
};

export async function startGanacheServer (
  port: number,
  networkId: number,
  populatedAccounts: GanacheAccounts[],
  options: any = {}
) {
  const ganacheServer = ganache.server({
    accounts: populatedAccounts,
    // quiet: true,
    chainId: networkId,
    miner: {
      blockTime: 1
    },
    network_id: networkId,
    ...options
  });

  await ganacheServer.listen(port);
  console.log(`Ganache Started on http://127.0.0.1:${port} ..`);

  return ganacheServer;
}
