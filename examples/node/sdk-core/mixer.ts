import { Note, NoteGenInput, ProvingManager } from '@webb-tools/sdk-core';
import { fetchRPCTreeLeaves, polkadotTx, preparePolkadotApi, transferBalance } from '../utils.js';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { ProvingManagerSetupInput } from '@webb-tools/sdk-core/src';
import path from 'path';
import fs from 'fs';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { WithdrawProof } from '../../../tests/utils';

async function mixerBn254() {
  const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';
  await cryptoWaitReady();
  const k = new Keyring({ type: 'sr25519' });
  const bob = k.addFromMnemonic(BOBPhrase);
  const charlie = k.addFromUri('//Charlie');
  // API promise inlining
  const apiPromise = await preparePolkadotApi();
  console.info(`[ mixerBn254 ] Prepared the api promise`);
  // Transfer balance for BOB from Charlie
  await transferBalance(apiPromise, charlie, [bob], 10000);
  console.info(`[ mixerBn254 ] Transferred the balance to Bob`);
  // => Depositing with bob account <=
  // Fill in the note Generate input
  const noteGenInput: NoteGenInput = {
    protocol: 'mixer',
    version: 'v2',
    sourceChain: '1',
    targetChain: '1',
    amount: '1',
    tokenSymbol: 'WEBB',
    sourceIdentifyingData: '3',
    targetIdentifyingData: '3',
    denomination: '18',
    backend: 'Arkworks',
    hashFunction: 'Poseidon',
    curve: 'Bn254',
    width: '3',
    exponentiation: '5',
  };
  // Generate deposit note
  const note = await Note.generateNote(noteGenInput);
  const leaf = note.getLeaf();
  console.info(`[ mixerBn254 ] Note generate the leaf is ${u8aToHex(leaf)}`);
  // Do the transaction for depositing
  await polkadotTx(apiPromise, { section: 'mixerBn254', method: 'deposit' }, [0, leaf], bob);
  console.log(`[ mixerBn254 ] Deposit is Done successfully`);
  // Withdraw for mixerBn254
  const accountId = bob.address;
  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(bob.address));
  const leaves = await fetchRPCTreeLeaves(apiPromise, 0);
  console.log(`[ mixerBn254 ]  leaves ${leaves.length}`);
  // Proving Manager
  const pm = new ProvingManager(undefined);
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
  // Proving key
  const pk = fs.readFileSync(pkPath);

  // Proving Input
  const provingInput: ProvingManagerSetupInput<'mixer'> = {
    leafIndex: 0,
    provingKey: hexToU8a(pk.toString('hex')),
    note: note.serialize(),
    fee: 0,
    refund: 0,
    leaves,
    recipient: addressHex.replace('0x', ''),
    relayer: relayerAddressHex.replace('0x', ''),
  };

  // Proof
  const proof = await pm.prove('mixer', provingInput);

  const withdrawProof: WithdrawProof = {
    id: String(0),
    proofBytes: `0x${proof.proof}` as any,
    root: `0x${proof.root}`,
    nullifierHash: `0x${proof.nullifierHash}`,
    recipient: accountId,
    relayer: bob.address,
    fee: 0,
    refund: 0,
  };

  // Transaction Params
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

  // Sending the transaction
  const txHash = await polkadotTx(apiPromise, { section: 'mixerBn254', method: 'withdraw' }, params, bob);

  console.log(txHash);
  await apiPromise.disconnect();
  // Kill the process
  process.exit(0);
}

mixerBn254().catch((e) => {
  console.error(e);
});
