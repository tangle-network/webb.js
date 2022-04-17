// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import pkg from 'websocket';

const { w3cwebsocket: WebSocket } = pkg;

const main = (): void => {
  const endpoint = 'ws://localhost:9944';

  console.log('Connecting to ', endpoint);
  const ws = new WebSocket(endpoint);

  ws.onopen = (): void => {
    ws.send('{"id":"1","jsonrpc":"2.0","method":"state_getMetadata","params":[]}');
  };

  ws.onmessage = (msg: any): void => {
    const fullData = JSON.parse(msg.data);
    const metadata = fullData.result;

    fs.writeFileSync('packages/types/src/metadata/static-latest.ts', `export default '${metadata}'`);
    fs.writeFileSync('packages/types/src/metadata/metadata.json', JSON.stringify(fullData, null, 2));

    console.log('Done');
    process.exit(0);
  };
};

main();
