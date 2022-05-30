import { JsNote, JsUtxo } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { ApiPromise } from '@polkadot/api';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { currencyToUnitI128, KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import { ProvingManagerSetupInput, ProvingManagerWrapper ,Note } from '@webb-tools/sdk-core/index.js';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { polkadotTx } from '@webb-tools/test-utils/index.js';
import path from 'path';
import fs from 'fs';

import { naclEncrypt, randomAsU8a } from '@polkadot/util-crypto';

let apiPromise: ApiPromise | null = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;
let nodes: KillTask | undefined;

const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';

function getKeyring() {
  if (keyring) {
    return keyring;
  }
  const k = new Keyring({ type: 'sr25519' });
  const bob = k.addFromMnemonic(BOBPhrase);
  const alice = k.addFromUri('//Alice');
  const charlie = k.addFromUri('//Charlie');
  keyring = {
    bob,
    alice,
    charlie
  };
  return keyring;
}

async function generateVAnchorNote(amount: number, chainId: number, outputChainId: number, index?: number) {

const note = await  Note.generateNote({
    protocol:'vanchor',
    version:'v2',
    backend:'Arkworks',
    hashFunction:'Poseidon',
    curve:'Bn254',
    width:String(5),
    exponentiation:String(5),
    denomination:String(18),
    amount:String(amount),
    tokenSymbol:'WEBB',
    targetChain:String(outputChainId),
    sourceChain:String(chainId),
    sourceIdentifyingData:'',
    targetIdentifyingData:'',
  })
  if (index !== undefined) {
   await note.mutateIndex(String(index))
  }

  return note;
}

async function createVAnchor(apiPromise: ApiPromise, singer: KeyringPair): Promise<number> {
  await polkadotTx(apiPromise, {
    section: 'sudo',
    method: 'sudo'
  }, [apiPromise.tx.vAnchorBn254.create(1, 30, 0)], singer);
  const nextTreeId = await apiPromise?.query.merkleTreeBn254.nextTreeId();
  return nextTreeId.toNumber() - 1;
};
const chainId = '2199023256632';

async function createVAnchorWithDeposit(
  apiPromise: ApiPromise,
  sudo: KeyringPair,
  depositer: KeyringPair
): Promise<[number, [JsNote, JsNote], Uint8Array ,Uint8Array]> {
  const treeId = await createVAnchor(apiPromise, sudo);
  const outputChainId = BigInt(chainId);
  const secret = randomAsU8a();
  const pkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'protocol-substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-2-2',
    'proving_key_uncompressed.bin'
  );
  const pk_hex = fs.readFileSync(pkPath).toString('hex');
  const pk = hexToU8a(pk_hex);

  // Creating two empty vanchor notes
  const note1 = await generateVAnchorNote(0, Number(outputChainId.toString()), Number(outputChainId.toString()), 0);
  const note2 = note1.getDefaultUtxoNote();
  const publicAmount = currencyToUnitI128(10);
  const notes = [note1, note2];
  // Output UTXOs configs
  const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, publicAmount.toString(), chainId, undefined);
  const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, '0', chainId, undefined);
  // Configure a new proving manager with direct call
  const provingManager = new ProvingManagerWrapper('direct-call');
  const leavesMap: any = {};

  const address = depositer.address;
  const extAmount = currencyToUnitI128(10);
  const fee = 0;
  // Empty leaves
  leavesMap[outputChainId.toString()] = [];
  const tree = await apiPromise!.query.merkleTreeBn254.trees(treeId);
  const root = tree.unwrap().root.toHex();
  const rootsSet = [hexToU8a(root), hexToU8a(root)];
  const decodedAddress = decodeAddress(address);
  const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
  const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);



  const setup: ProvingManagerSetupInput<'vanchor'> = {
    chainId: outputChainId.toString(),
    indices: [0, 0],
    inputNotes: notes.map((note) => note.serialize()),
    leavesMap: leavesMap,
    output: [output1, output2],
    encryptedCommitments: [comEnc1, comEnc2],
    provingKey: pk,
    publicAmount: String(publicAmount),
    roots: rootsSet,
    relayer: decodedAddress,
    recipient: decodedAddress,
    extAmount: extAmount.toString(),
    fee: fee.toString()
  };
  const data = await provingManager.prove('vanchor', setup);
  const extData = {
    relayer: address,
    recipient: address,
    fee,
    ext_amount: extAmount,
    encrypted_output1: comEnc1,
    encrypted_output2: comEnc2
  };

  let vanchorProofData = {
    proof: `0x${data.proof}`,
    publicAmount: data.publicAmount,
    roots: rootsSet,
    inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
    outputCommitments: data.outputNotes.map(note => u8aToHex(note.getLeafCommitment())),
    extDataHash: data.extDataHash
  };
  const leafsCount = await apiPromise.derive.merkleTreeBn254.getLeafCountForTree(Number(treeId));
  const indexBeforeInsetion = Math.max(leafsCount - 1, 0);

  console.log([treeId, vanchorProofData, extData]);

  await polkadotTx(apiPromise!, {
    section: 'vAnchorBn254',
    method: 'transact'
  }, [treeId, vanchorProofData, extData], depositer);
  const leaf1 = data.outputNotes[0].getLeafCommitment();
  const leaf2 = data.outputNotes[1].getLeafCommitment();
  const indexOfLeaf1 = await getleafIndex(apiPromise, leaf1, indexBeforeInsetion, treeId);
  const indexOfLeaf2 = await getleafIndex(apiPromise, leaf2, indexBeforeInsetion, treeId);
  const note1WithIndex = data.outputNotes[0];
  note1WithIndex.mutateIndex(String(indexOfLeaf1));
  const note2WithIndex = data.outputNotes[1];
  note2WithIndex.mutateIndex(String(indexOfLeaf2));

  return [treeId, [note1WithIndex, note2WithIndex], pk,secret];
}

async function getleafIndex(
  api: ApiPromise,
  leaf: Uint8Array, indexBeforeInsertion: number, treeId: number): Promise<number> {
  /**
   * Ex tree has 500 leaves
   * Before insertion index is 499
   * Given that many insertions happened while processing a tx
   * The tree now has 510 leaves
   * Fetch a slice of the leaves starting from the index before insertion [index499,...index509]
   * The leaf index will be index499 +  the index of the slice
   * */
  const leafCount = await api.derive.merkleTreeBn254.getLeafCountForTree(Number(treeId));
  const leaves = await api.derive.merkleTreeBn254.getLeavesForTree(Number(treeId), indexBeforeInsertion, leafCount - 1);
  const leafHex = u8aToHex(leaf);
  const shiftedIndex = leaves.findIndex(leaf => u8aToHex(leaf) === leafHex);

  if (shiftedIndex === -1) {
    throw new Error(`Leaf isn't in the tree`);
  }
  return indexBeforeInsertion + shiftedIndex;
}

describe.only('VAnchor tests', function() {
  this.timeout(120_000);
  before(async function() {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
    const { bob, charlie, alice } = getKeyring();
    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
  });


  it('VAnchor deposit', async function() {
    const { bob, alice } = getKeyring();
    const secret = randomAsU8a();

    // ChainId
    const outputChainId = BigInt('2199023256632');
    const pkPath = path.join(
      // tests path
      process.cwd(),
      'tests',
      'protocol-substrate-fixtures',
      'vanchor',
      'bn254',
      'x5',
      '2-2-2',
      'proving_key_uncompressed.bin'
    );
    const pk_hex = fs.readFileSync(pkPath).toString('hex');
    const pk = hexToU8a(pk_hex);

    const treeId = await createVAnchor(apiPromise!, alice);

    // Creating two empty vanchor notes
    const note1 = await generateVAnchorNote(0, Number(outputChainId.toString()), Number(outputChainId.toString()), 0);
    const note2 = note1.getDefaultUtxoNote();

    const publicAmount = currencyToUnitI128(10);
    const notes = [note1, note2];
    // Output UTXOs configs
    const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, publicAmount.toString(), chainId, undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, '0', chainId, undefined);
    // Configure a new proving manager with direct call
    const provingManager = new ProvingManagerWrapper('direct-call');
    const leavesMap: any = {};

    const address = alice.address;
    const extAmount = currencyToUnitI128(10);
    const fee = 0;
    // Empty leaves
    leavesMap[outputChainId.toString()] = [];
    const tree = await apiPromise!.query.merkleTreeBn254.trees(treeId);
    const root = tree.unwrap().root.toHex();
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const decodedAddress = decodeAddress(address);
    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);


    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: outputChainId.toString(),
      indices: [0, 0],
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap: leavesMap,
      output: [output1, output2],
      encryptedCommitments: [comEnc1, comEnc2],
      provingKey: pk,
      publicAmount: String(publicAmount),
      roots: rootsSet,
      relayer: decodedAddress,
      recipient: decodedAddress,
      extAmount: extAmount.toString(),
      fee: fee.toString()
    };
    const data = await provingManager.prove('vanchor', setup);
    const extData = {
      relayer: address,
      recipient: address,
      fee,
      ext_amount: extAmount,
      encrypted_output1: comEnc1,
      encrypted_output2: comEnc2
    };

    let vanchorProofData = {
      proof: `0x${data.proof}`,
      publicAmount: data.publicAmount,
      roots: rootsSet,
      inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
      outputCommitments: data.outputNotes.map(note => u8aToHex(note.getLeafCommitment())),
      extDataHash: data.extDataHash
    };
    try {


      await polkadotTx(apiPromise!, {
        section: 'vAnchorBn254',
        method: 'transact'
      }, [treeId, vanchorProofData, extData], bob);

    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it('VAnchor deposit and withdraw', async function() {
    const { bob, alice } = getKeyring();
    const fee = 0;
    const leavesMap: any = {};

    const [treeId, notes, pk ,secret] = await createVAnchorWithDeposit(apiPromise!, alice, bob);
    console.log('Did deposit');
    const chainId = BigInt(notes[0].targetChainId); // both two notes have the same chain id

    const withdrawAmount = notes.reduce((acc, note) => acc + Number(note.amount), 0);
    const extAmount = -withdrawAmount;

    const publicAmount = -withdrawAmount;

    const output1 = new JsUtxo('Bn254', 'Arkworks', 2, 2, '0', chainId.toString(), undefined);
    const output2 = new JsUtxo('Bn254', 'Arkworks', 2, 2, '0', chainId.toString(), undefined);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const address = bob.address;
    const leaf1Index = Number(notes[0].index);
    const leaf2Index = Number(notes[1].index);
    const maxLeafIndex = Math.max(leaf1Index, leaf2Index);
    const leaves = await apiPromise!.derive.merkleTreeBn254.getLeavesForTree(treeId, 0, maxLeafIndex);
    const neighborRoots: string[] = await (apiPromise!.rpc as any).lt.getNeighborRoots(treeId).then((roots: any) => roots.toHuman());

    leavesMap[chainId.toString()] = leaves;
    const tree = await apiPromise!.query.merkleTreeBn254.trees(treeId);
    const root = tree.unwrap().root.toHex();
    const rootsSet = [hexToU8a(root), hexToU8a(neighborRoots[0])];
    const decodedAddress = decodeAddress(address);

    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);


    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: chainId.toString(),
      indices: [leaf1Index, leaf2Index],
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap: leavesMap,
      output: [output1, output2],
      encryptedCommitments: [comEnc1, comEnc2],
      provingKey: pk,
      publicAmount: String(publicAmount),
      roots: rootsSet,
      relayer: decodedAddress,
      recipient: decodedAddress,
      extAmount: extAmount.toString(),
      fee: fee.toString()
    };
    const data = await provingManager.prove('vanchor', setup);
    const extData = {
      relayer: address,
      recipient: address,
      fee,
      ext_amount: extAmount,
      encrypted_output1: comEnc1,
      encrypted_output2: comEnc2
    };

    let vanchorProofData = {
      proof: `0x${data.proof}`,
      publicAmount: data.publicAmount,
      roots: rootsSet,
      inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
      outputCommitments: data.outputNotes.map(note => note.getLeafCommitment()),
      extDataHash: data.extDataHash
    };

    await polkadotTx(apiPromise!, {
      section: 'vAnchorBn254',
      method: 'transact'
    }, [treeId, vanchorProofData, extData], bob);
  });

  after(async function() {
    await nodes?.();
  });
});
