import { cryptoWaitReady } from '@polkadot/util-crypto';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { fetchRPCTreeLeaves, polkadotTx, preparePolkadotApi, transferBalance } from '../utils.js';
import { Note, NoteGenInput, ProvingManager, ProvingManagerSetupInput } from '@webb-tools/sdk-core/index.js';
import path from 'path';
import fs from 'fs';
import { AnchorWithdrawProof } from '../../../tests/utils/index.js';

import { u8aToHex } from '@polkadot/util';

export async function anchorBn254() {
  const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';
  await cryptoWaitReady();
  const k = new Keyring({ type: 'sr25519' });
  const bob = k.addFromMnemonic(BOBPhrase);
  const charlie = k.addFromUri('//Charlie');
  // API promise inlining
  const apiPromise = await preparePolkadotApi();
  console.info(`[ anchorBn254 ] Prepared the api promise`);
  // Transfer balance for BOB from Charlie
  await transferBalance(apiPromise, charlie, [bob], 10000);
  console.info(`[ anchorBn254 ] Transferred the balance to Bob`);
  const treeId = '3';
  // => Depositing with bob account <=
  const noteGenInput: NoteGenInput = {
    amount: '10',
    backend: 'Arkworks',
    curve: 'Bn254',
    denomination: '18',
    exponentiation: '5',
    hashFunction: 'Poseidon',
    protocol: 'anchor',
    sourceChain: '2199023256632',
    targetChain: '2199023256632',
    tokenSymbol: 'WEBB',
    version: 'v2',
    width: '4',
  };
  const note = await Note.generateNote(noteGenInput);
  console.info(`[ anchorBn254 ] Generated the deposit note ${note.serialize()}`);
  const leaf = note.getLeaf();
  await polkadotTx(apiPromise, { section: 'anchorBn254', method: 'deposit' }, [treeId, leaf], bob);
  console.log(`[ anchorBn254 ] Deposited successfully`);
  // withdraw
  const accountId = bob.address;
  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(bob.address));
  const leaves = await fetchRPCTreeLeaves(apiPromise, treeId);
  console.log(`[ anchorBn254 ]  leaves ${leaves.length}`);
  // Proving Manager
  const pm = new ProvingManager(undefined);
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
  const leafHex = u8aToHex(note.getLeaf());
  const leafIndex = leaves.findIndex((l) => u8aToHex(l) === leafHex);

  const proveInput: ProvingManagerSetupInput<'anchor'> = {
    fee: 0,
    leafIndex,
    leaves,
    note: note.serialize(),
    provingKey: pk,
    recipient: addressHex.replace('0x', ''),
    refund: 0,
    relayer: relayerAddressHex.replace('0x', ''),
    refreshCommitment: '0000000000000000000000000000000000000000000000000000000000000000',
    roots: [],
  };
  const proof = await pm.prove('anchor', proveInput);
  const withdrawProof: AnchorWithdrawProof = {
    id: treeId,
    proofBytes: `0x${proof.proof}` as any,
    root: `0x${proof.root}`,
    nullifierHash: `0x${proof.nullifierHash}`,
    recipient: accountId,
    relayer: bob.address,
    fee: 0,
    refund: 0,
    commitment: `0x0000000000000000000000000000000000000000000000000000000000000000`,
  };
  const params = [
    withdrawProof.id,
    withdrawProof.proofBytes,
    proof.roots.map((i: string) => `0x${i}`),
    withdrawProof.nullifierHash,
    withdrawProof.recipient,
    withdrawProof.relayer,
    withdrawProof.fee,
    withdrawProof.refund,
    withdrawProof.commitment,
  ];

  return polkadotTx(apiPromise, { method: 'withdraw', section: 'anchorBn254' }, params, bob);
}

anchorBn254().catch((e) => {
  console.error(e);
});
