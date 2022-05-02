import {fetchRPCTreeLeaves, polkadotTx, preparePolkadotApi, transferBalance} from "../utils.js";
import {decodeAddress, Keyring} from "@polkadot/keyring";
import {cryptoWaitReady} from '@polkadot/util-crypto'
import {Note, NoteGenInput, ProvingManager, u8aToHex, ProvingManagerSetupInput} from "@webb-tools/sdk-core/src/index.js";
import path from "path";
import fs from "fs";
import {hexToU8a} from "@polkadot/util";
import {WithdrawProof} from "../../../tests/utils/index.js";

// This script details usage of our mixer pallets (and proving / verifying) from nodejs.
async function mixerBn254() {

  // The application environment will define components for interacting with the chain which implements our mixer pallets.
  // For this script, we hard-code the account to be the well-known 'Bob' account,
  // but DApp developers will likely take this information from the injected polkadot.js extension.
  const BOBPhrase =
    'asthma early danger glue satisfy spatial decade wing organ bean census announce';
  await cryptoWaitReady();
  const k = new Keyring({type: 'sr25519'});
  const bob = k.addFromMnemonic(BOBPhrase);
  const apiPromise = await preparePolkadotApi();
  console.info(`[ mixerBn254 ] Prepared the api promise`);

  // After waiting for the appropriate crypto and polkadot.js api initialization, start creating
  // some transactions to the mixer pallets.

  /*** => Depositing with Bob account <= ***/

  // The Webb.js note generation process allows for a variety of configurable parameters.
  // This example will relate these parameters to the substrate mixer context.
  // 
  // The application environment will define the values for note input parameters.
  // These note inputs allow for metadata to be attached to the note, which helps to:
  //   (1) Identify which deposit is controlled by the note.
  //   (2) Identify how a note should be generated.
  //   (3) Auxiliary information that could be useful to know about a deposit.
  // 
  // Some important parameters and example usage:
  //
  //  (1)
  //    - targetChain: Parameter to determine the chain for a deposit.
  //        - Our DApp maps substrate chains to our defined 'InternalChainId'. Applications are free
  //          to determine some custom identification.
  //    - targetIdentifyingData: Parameter to determine the location of a deposit on a chain.
  //        - In substrate, the mixer instance has an associated merkle tree. This merkle tree
  //          has an identifier. Our DApp populates this identifier in this field.

  //  (2)
  //    - backend:
  //        - Our substrate mixer pallets use 'Arkworks' as a backend. But other deployments (i.e. EVM)
  //          have 'Circom' as a backend.
  //    - hashFunction:
  //        - Our substrate mixer pallets use 'Poseidon' as a hash function. But other deployments (i.e. EVM)
  //          have 'Pederson' as a backend.
  //    - curve:
  //        - Our substrate mixer pallets use 'Bn254' for their curve.
  //    - width:
  //        - Related to the amount of secret parameters hashed together. Substrate mixer pallets assume the leaf
  //          was created with hash(chainID, nullifier, secret).
  const noteGenInput: NoteGenInput = {
    protocol: 'mixer',
    version: 'v2',
    sourceChain: "1",
    targetChain: "1",
    amount: "1",
    tokenSymbol: "WEBB",
    sourceIdentifyingData: "3",
    targetIdentifyingData: '3',
    denomination: "18",
    backend: "Arkworks",
    hashFunction: "Poseidon",
    curve: "Bn254",
    width: '3',
    exponentiation: "5"
  }

  // Generate deposit note, and the secrets associated with the deposit.
  const note = await Note.generateNote(noteGenInput)

  // The leaf is the value inserted on-chain. Users can prove knowledge of
  // the secrets which were used in generating a leaf, without revealing the secrets.
  const leaf = note.getLeaf();

  console.info(`[ mixerBn254 ] Note generate the leaf is ${u8aToHex(leaf)}`);

  // Do the transaction for depositing
  await polkadotTx(
    apiPromise,
    {section: 'mixerBn254', method: 'deposit'},
    [0, leaf], // Deposit into the treeId 0, the leaf value.
    bob
  );
  console.log(`[ mixerBn254 ] Deposit is Done successfully`);

  /*** => Withdrawing with Bob account <= ***/

  // Zero knowledge systems have an associated proving key for their zero-knowledge circuits.
  const accountId = bob.address;
  const addressHex = u8aToHex(decodeAddress(accountId));
  const relayerAddressHex = u8aToHex(decodeAddress(accountId));
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


  // Define the different parameters involved for generating a proof and successfully withdrawing:
  // 
  // leafIndex:
  //      - This NodeJS example has hard-coded it to 0. But our DApp references the auxiliary information
  //        that was populated on note generation.
  // provingKey:
  //      - In this NodeJS example, we've referenced the proving key from our git submodule file on disk.
  //      - DApp developers will likely fetch this information from IPFS or some other server.
  // leaves:
  //      - In order to create a proof about state of the merkle tree, 
  //        we need to be able to build the merkle tree ourselves.
  // fee: Fees can be specified to pay out the relayer of a withdraw transaction. This example does not use a relayer.
  // relayer: Who should be paid the fees of the withdraw transaction? Bob puts his own address as the relayer.
  const provingInput: ProvingManagerSetupInput = {
    leafIndex: 0,
    provingKey: hexToU8a(pk.toString('hex')),
    note: note.serialize(),
    fee: 0,
    refund: 0,
    leaves,
    recipient: addressHex.replace('0x', ''),
    relayer: relayerAddressHex.replace('0x', '')
  };

  // Generate the proof
  const proof = await pm.prove(provingInput)

  // Format the proof information in the forms that substrate expects
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
  const txHash = await polkadotTx(
    apiPromise,
    {section: 'mixerBn254', method: 'withdraw'},
    params,
    bob
  );

  console.log(txHash);
  await apiPromise.disconnect();
// Kill the process
  process.exit(0);
}


mixerBn254()
  .catch(e => {
    console.error(e);
  })
