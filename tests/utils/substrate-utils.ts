import { ApiPromise, WsProvider } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import {
  AnchorMTBn254X5,
  generate_proof_js,
  JsNote,
  JsNoteBuilder,
  OperationError,
  ProofInputBuilder,
} from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import path from 'path';
import fs from 'fs';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { BigNumber } from 'ethers';

/// <reference path="@webb-tools/types/interfaces/types.d.ts"
export function currencyToUnitI128(currencyAmount: number) {
  let bn = BigNumber.from(currencyAmount);
  return bn.mul(1_000_000_000_000);
}

type MethodPath = {
  section: string;
  method: string;
};

export function polkadotTx(
  api: ApiPromise,
  path: MethodPath,
  params: any[],
  signer: KeyringPair
) {
  // @ts-ignore
  const tx = api.tx[path.section][path.method](...params);
  return new Promise<string>((resolve, reject) => {
    tx.signAndSend(signer, (result) => {
      const status = result.status;
      const events = result.events.filter(
        ({ event: { section } }) => section === 'system'
      );
      if (status.isInBlock || status.isFinalized) {
        for (const event of events) {
          const {
            event: { data, method },
          } = event;
          const [dispatchError] = data as any;

          if (method === 'ExtrinsicFailed') {
            let message = dispatchError.type;

            if (dispatchError.isModule) {
              try {
                const mod = dispatchError.asModule;
                const error = dispatchError.registry.findMetaError(mod);

                message = `${error.section}.${error.name}`;
              } catch (error) {
                reject(message);
              }
            } else if (dispatchError.isToken) {
              message = `${dispatchError.type}.${dispatchError.asToken.type}`;
            }

            reject(message);
          } else if (method === 'ExtrinsicSuccess') {
            resolve(tx.hash.toString());
          }
        }
      }
    }).catch((e) => reject(e));
  });
}

export async function preparePolkadotApi() {
  const wsProvider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create({
    provider: wsProvider,
    rpc: {
      mt: {
        getLeaves: {
          description: 'Query for the tree leaves',
          params: [
            {
              name: 'tree_id',
              type: 'u32',
              isOptional: false,
            },
            {
              name: 'from',
              type: 'u32',
              isOptional: false,
            },
            {
              name: 'to',
              type: 'u32',
              isOptional: false,
            },
            {
              name: 'at',
              type: 'Hash',
              isOptional: true,
            },
          ],
          type: 'Vec<[u8; 32]>',
        },
      },
    },
  });
  return api.isReady;
}

export function awaitPolkadotTxFinalization(
  tx: SubmittableExtrinsic,
  signer: KeyringPair
) {
  return new Promise((resolve, reject) => {
    tx.signAndSend(signer, { nonce: -1 }, (status) => {
      if (status.isFinalized || status.isCompleted) {
        resolve(tx.hash);
      }
      if (status.isError) {
        reject(status.dispatchError);
      }
    }).catch((e) => reject(e));
  });
}

export async function transferBalance(
  api: ApiPromise,
  source: KeyringPair,
  receiverPairs: KeyringPair[],
  number: number = 1000
) {
  // transfer to alice
  for (const receiverPair of receiverPairs) {
    await polkadotTx(
      api,
      { section: 'balances', method: 'transfer' },
      [receiverPair.address, currencyToUnitI128(number).toString()],
      source
    );
  }
}

export async function setORMLTokenBalance(
  api: ApiPromise,
  sudoPair: KeyringPair,
  receiverPair: KeyringPair,
  ORMLCurrencyId: number = 0,
  amount: number = 1000
) {
  return new Promise((resolve, reject) => {
    const address = api.createType('MultiAddress', {
      Id: receiverPair.address,
    });
    // @ts-ignore
    api.tx.sudo
      .sudo(
        // @ts-ignore
        api.tx.currencies.updateBalance(
          address,
          ORMLCurrencyId,
          currencyToUnitI128(amount)
        )
      )
      .signAndSend(sudoPair, (res) => {
        if (res.isFinalized || res.isCompleted) {
          resolve(null);
        }
        if (res.isError) {
          reject(res.dispatchError);
        }
      });
  });
}

// @ts-ignore
export async function fetchLinkableAnchorBn254(apiPromise: ApiPromise) {
  // Run the
}
export async function fetchCachedRoot(apiPromise: ApiPromise, treeId: string) {
  const storage =
    // @ts-ignore
    await apiPromise.query.merkleTreeBn254.trees(treeId);
  // @ts-ignore
  return storage.toHuman().root;
}

export async function getAnchors(apiPromise: ApiPromise) {
  // @ts-ignore
  const anchors = await apiPromise.query.anchorBn254.anchors.entries();
  const anc = anchors.map(([key, entry]) => {
    const treeId = (key.toHuman() as Array<string>)[0];
    return { treeId, anchor: entry.toHuman() };
  });
  return anc;
}

export async function fetchRPCTreeLeaves(
  api: ApiPromise,
  treeId: string | number
): Promise<Uint8Array[]> {
  let done = false;
  let from = 0;
  let to = 511;
  const leaves: Uint8Array[] = [];

  while (done === false) {
    const treeLeaves: any[] = await (api.rpc as any).mt.getLeaves(
      treeId,
      from,
      to
    );
    if (treeLeaves.length === 0) {
      done = true;
      break;
    }
    leaves.push(...treeLeaves.map((i) => i.toU8a()));
    from = to;
    to = to + 511;
  }
  return leaves;
}

export async function depositMixerBnX5_3(
  api: ApiPromise,
  depositor: KeyringPair
) {
  let noteBuilder = new JsNoteBuilder();
  noteBuilder.protocol('mixer');
  noteBuilder.version('v2');

  noteBuilder.sourceChainId('1');
  noteBuilder.targetChainId('1');
  noteBuilder.sourceIdentifyingData('3');
  noteBuilder.targetIdentifyingData('3');

  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.amount('1');
  noteBuilder.denomination('18');

  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');
  noteBuilder.width('3');
  noteBuilder.exponentiation('5');
  const note = noteBuilder.build();
  const leaf = note.getLeafCommitment();

  await polkadotTx(
    api,
    { section: 'mixerBn254', method: 'deposit' },
    [0, leaf],
    depositor
  );
  return note;
}

export type WithdrawProof = {
  id: string;
  proofBytes: string;
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: number;
  refund: number;
};
export type AnchorWithdrawProof = WithdrawProof & {
  commitment: string;
};

export function catchWasmError<T extends (...args: any) => any>(
  fn: T
): ReturnType<T> {
  try {
    return fn();
  } catch (e) {
    const error = e as OperationError;

    const errorMessage = {
      code: error.code,
      errorMessage: error.error_message,
      data: error.data,
    };
    console.log(errorMessage);
    throw errorMessage;
  }
}

function firstAnchorTreeId(apiPromise: ApiPromise) {
  return getAnchors(apiPromise).then((i) => i[0]!.treeId) as Promise<string>;
}

export async function depositAnchorBnX5_4(
  api: ApiPromise,
  depositor: KeyringPair
) {
  const treeId = await firstAnchorTreeId(api);

  let noteBuilder = new JsNoteBuilder();
  noteBuilder.protocol('anchor');
  noteBuilder.version('v2');

  noteBuilder.sourceChainId('2199023256632');
  noteBuilder.targetChainId('2199023256632');
  noteBuilder.sourceIdentifyingData(treeId);
  noteBuilder.targetIdentifyingData(treeId);

  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.amount('1');
  noteBuilder.denomination('18');

  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');
  noteBuilder.width('4');
  noteBuilder.exponentiation('5');
  const note = noteBuilder.build();
  const leaf = note.getLeafCommitment();

  await polkadotTx(
    api,
    { method: 'deposit', section: 'anchorBn254' },
    [treeId, leaf],
    depositor
  );
  return note;
}

export async function createAnchor(
  api: ApiPromise,
  sudoPair: KeyringPair,
  size: number /* Size should be more the existential balance*/,
  assetId: number = 0,
  maxEdges: number = 2,
  depth: number = 3
) {
  return polkadotTx(
    api,
    { method: 'sudo', section: 'sudo' },
    [
      // @ts-ignore
      api.tx.anchorBn254.create(
        currencyToUnitI128(size).toString(),
        maxEdges,
        depth,
        assetId
      ),
    ],
    sudoPair
  );
}

export async function withdrawAnchorBnx5_4(
  api: ApiPromise,
  signer: KeyringPair,
  note: JsNote,
  relayerAccountId: string
): Promise<string> {
  const accountId = signer.address;

  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(relayerAccountId));
  const treeId = await firstAnchorTreeId(api);

  // fetch leaves
  const leaves = await fetchRPCTreeLeaves(api, Number(treeId));
  const proofInputBuilder = new ProofInputBuilder();
  const leafHex = u8aToHex(note.getLeafCommitment());
  proofInputBuilder.setNote(note);
  proofInputBuilder.setLeaves(leaves);
  const leafIndex = leaves.findIndex((l) => u8aToHex(l) === leafHex);

  proofInputBuilder.setLeafIndex(String(leafIndex));

  proofInputBuilder.setFee('5');
  proofInputBuilder.setRefund('1');
  const merkeTree = new AnchorMTBn254X5(leaves, String(leafIndex));
  const root = `0x${merkeTree.root}`;

  proofInputBuilder.setRefreshCommitment('0000000000000000000000000000000000000000000000000000000000000000');
  // 1 from eth
  // 1 from substrate
  proofInputBuilder.setRoots([hexToU8a(root), hexToU8a(root)]);

  proofInputBuilder.setRecipient(addressHex.replace('0x', ''));
  proofInputBuilder.setRelayer(relayerAddressHex.replace('0x', ''));

  const pkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'protocol-substrate-fixtures',
    'fixed-anchor',
    'bn254',
    'x5',
    '2',
    'proving_key_uncompressed.bin'
  );
  const pk = fs.readFileSync(pkPath);

  proofInputBuilder.setPk(pk.toString('hex'));

  const proofInput = proofInputBuilder.build_js();

  const zkProofMetadata = generate_proof_js(proofInput);

  const withdrawProof: AnchorWithdrawProof = {
    id: treeId,
    proofBytes: `0x${zkProofMetadata.proof}` as any,
    root: `0x${zkProofMetadata.root}`,
    nullifierHash: `0x${zkProofMetadata.nullifierHash}`,
    recipient: accountId,
    relayer: relayerAccountId,
    fee: 5,
    refund: 1,
    commitment: `0x0000000000000000000000000000000000000000000000000000000000000000`,
  };
  const params = [
    withdrawProof.id,
    withdrawProof.proofBytes,
    zkProofMetadata.roots.map((i: string) => `0x${i}`),
    withdrawProof.nullifierHash,
    withdrawProof.recipient,
    withdrawProof.relayer,
    withdrawProof.fee,
    withdrawProof.refund,
    withdrawProof.commitment,
  ];
  return polkadotTx(
    api,
    { method: 'withdraw', section: 'anchorBn254' },
    params,
    signer
  );
}

export async function withdrawMixerBnX5_3(
  api: ApiPromise,
  signer: KeyringPair,
  note: JsNote,
  relayerAccountId: string
) {
  const accountId = signer.address;

  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(relayerAccountId));
  // Fetch leaves
  const leaves = await fetchRPCTreeLeaves(api, 0);
  const proofInputBuilder = new ProofInputBuilder();
  const leafHex = u8aToHex(note.getLeafCommitment());
  proofInputBuilder.setNote(note);
  proofInputBuilder.setLeaves(leaves);
  const leafIndex = leaves.findIndex((l) => u8aToHex(l) === leafHex);

  proofInputBuilder.setLeafIndex(String(leafIndex));

  proofInputBuilder.setFee('0');
  proofInputBuilder.setRefund('0');

  proofInputBuilder.setRecipient(addressHex.replace('0x', ''));
  proofInputBuilder.setRelayer(relayerAddressHex.replace('0x', ''));
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'protocol-substrate-fixtures',
    'mixer',
    'bn254',
    'x5',
    'proving_key_uncompressed.bin'
  );

  const pk = fs.readFileSync(pkPath);

  proofInputBuilder.setPk(pk.toString('hex'));

  const proofInput = proofInputBuilder.build_js();

  const zkProofMetadata = generate_proof_js(proofInput);

  /*
  const vkPath = path.join(
    // tests path
    process.cwd(),
    'protocol-substrate-fixtures',
    'mixer',
    'bn254',
    'x5',
    'verifying_key_uncompressed.bin'
  );
  const vk = fs.readFileSync(vkPath);
  const isValid = validate_proof(zkProofMetadata, vk.toString('hex'), 'Bn254');
*/

  const withdrawProof: WithdrawProof = {
    id: String(0),
    proofBytes: `0x${zkProofMetadata.proof}` as any,
    root: `0x${zkProofMetadata.root}`,
    nullifierHash: `0x${zkProofMetadata.nullifierHash}`,
    recipient: accountId,
    relayer: relayerAccountId,
    fee: 0,
    refund: 0,
  };
  const params = [
    withdrawProof.id,
    withdrawProof.proofBytes,
    withdrawProof.root,
    withdrawProof.nullifierHash,
    withdrawProof.recipient,
    withdrawProof.relayer,
    withdrawProof.fee,
    withdrawProof.refund,
  ];
  return polkadotTx(
    api,
    { section: 'mixerBn254', method: 'withdraw' },
    params,
    signer
  );
}
