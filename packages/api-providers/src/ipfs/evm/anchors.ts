// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { getCachedFixtureURI, withLocalFixtures } from '@webb-tools/api-providers/index.js';

export const fetchWasmForEdges = async (maxEdges: number) => {
  let ipfsHash: string;
  let cachedURI: string;

  switch (maxEdges) {
    case 1:
      ipfsHash = 'QmR3fNdhNrrtnxu6r5djiXf1gRk7vu2MXUzNJitjCx5kQx';
      cachedURI = getCachedFixtureURI('anchor_wasm_2.wasm');
      break;
    case 2:
      ipfsHash = 'QmQB2yBjuw99tfSZAyaB5E4q2WUKgiTrwJjEmDzfbmLrNs';
      cachedURI = getCachedFixtureURI('anchor_wasm_3.wasm');
      break;
    case 3:
      ipfsHash = 'QmWy3pxQt9tYFyDSnqiyNtgjMacex37sPeneZBYCpFTkCz';
      cachedURI = getCachedFixtureURI('anchor_wasm_4.wasm');
      break;
    case 4:
      ipfsHash = 'Qma7YsTpqUuBVGawLEZhrQyobtKSX1kJW25q2rdGQYaGf5';
      cachedURI = getCachedFixtureURI('anchor_wasm_5.wasm');
      break;
    case 5:
      ipfsHash = 'QmchjCgUruxrZ7gQJHGQRGicdEoAJSyAo1eFiaqt6HACPJ';
      cachedURI = getCachedFixtureURI('anchor_wasm_6.wasm');
      break;
    default:
      ipfsHash = 'QmR3fNdhNrrtnxu6r5djiXf1gRk7vu2MXUzNJitjCx5kQx';
      cachedURI = getCachedFixtureURI('anchor_wasm_2.wasm');
      break;
  }

  try {
    if (withLocalFixtures()) {
      const cachedWasmRequest = await fetch(cachedURI);
      const wasmBuf = await cachedWasmRequest.arrayBuffer();

      return wasmBuf;
    } else {
      const ipfsWasmRequest = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      const wasmBuf = await ipfsWasmRequest.arrayBuffer();

      return wasmBuf;
    }
  } catch (e) {
    console.log('error when fetching wasm from ipfs: ', e);
    throw e;
  }
};

export const fetchKeyForEdges = async (maxEdges: number) => {
  let ipfsHash: string;
  let cachedURI: string;

  switch (maxEdges) {
    case 1:
      ipfsHash = 'QmZwakSTkqrWB4kf4oVGWyrxAVVdu25xiVFsrC1wrqR8jf';
      cachedURI = getCachedFixtureURI('anchor_key_2.zkey');
      break;
    case 2:
      ipfsHash = 'QmUVPDV1yiT1pMNAm3LNcqvhEs2QvbEKBq13XE5nbmMK2s';
      cachedURI = getCachedFixtureURI('anchor_key_3.zkey');
      break;
    case 3:
      ipfsHash = 'QmPs3SCyZ2uboSrpzdQAT9JkYyybjrpcAF2Fhb2QYHgWf8';
      cachedURI = getCachedFixtureURI('anchor_key_4.zkey');
      break;
    case 4:
      ipfsHash = 'QmdBsxtCBzYQw1yo3n4goeVyZ5iDhJN33QSBqX88Dz3mVX';
      cachedURI = getCachedFixtureURI('anchor_key_5.zkey');
      break;
    case 5:
      ipfsHash = 'QmYV8kb2o8LgdWJPPKpKYnvAcx6yy4dQxmxA9WdHzresoN';
      cachedURI = getCachedFixtureURI('anchor_key_6.zkey');
      break;
    default:
      ipfsHash = 'QmZwakSTkqrWB4kf4oVGWyrxAVVdu25xiVFsrC1wrqR8jf';
      cachedURI = getCachedFixtureURI('anchor_key_2.zkey');
      break;
  }

  try {
    if (withLocalFixtures()) {
      const cachedKeyRequest = await fetch(cachedURI);
      const cachedKeyArrayBuffer = await cachedKeyRequest.arrayBuffer();
      const cachedKey = new Uint8Array(cachedKeyArrayBuffer);

      return cachedKey;
    } else {
      const ipfsKeyRequest = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      const circuitKeyArrayBuffer = await ipfsKeyRequest.arrayBuffer();
      const circuitKey = new Uint8Array(circuitKeyArrayBuffer);

      return circuitKey;
    }
  } catch (e) {
    console.log('error when fetching circuit key from ipfs: ', e);
    throw e;
  }
};
