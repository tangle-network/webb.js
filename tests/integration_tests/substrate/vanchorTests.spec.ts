import { ApiPromise } from '@polkadot/api';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { currencyToUnitI128, KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import {
  ArkworksProvingManager,
  calculateTypedChainId,
  ChainType,
  Keypair,
  Note,
  ProvingManagerSetupInput,
  Utxo,
  VAnchorProof
} from '@webb-tools/sdk-core/index.js';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { polkadotTx } from '@webb-tools/test-utils/index.js';
import path from 'path';
import fs from 'fs';
import { naclEncrypt, randomAsU8a } from '@polkadot/util-crypto';
import { MTBn254X5, verify_js_proof } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';

let apiPromise: ApiPromise | null = null;
let keyring: {
  bob: KeyringPair;
  alice: KeyringPair;
  charlie: KeyringPair;
} | null = null;
let nodes: KillTask | undefined;

const BOBPhrase = 'asthma early danger glue satisfy spatial decade wing organ bean census announce';

function getKeys() {
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

  const vkPath = path.join(
    // tests path
    process.cwd(),
    'tests',
    'protocol-substrate-fixtures',
    'vanchor',
    'bn254',
    'x5',
    '2-2-2',
    'verifying_key_uncompressed.bin'
  );
  const pk_hex = fs.readFileSync(pkPath).toString('hex');
  const pk = hexToU8a(pk_hex);
  const vk_hex = fs.readFileSync(vkPath).toString('hex');
  const vk = hexToU8a(vk_hex);
  return {
    pk,
    vk
  };
}

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
  const note = await Note.generateNote({
    amount: String(amount),
    backend: 'Arkworks',
    curve: 'Bn254',
    denomination: String(18),
    exponentiation: String(5),
    hashFunction: 'Poseidon',
    index,
    protocol: 'vanchor',
    sourceChain: String(chainId),
    sourceIdentifyingData: '1',
    targetChain: String(outputChainId),
    targetIdentifyingData: '1',
    tokenSymbol: 'WEBB',
    version: 'v1',
    width: String(5)
  });

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
let chainId = '2199023256632';

async function basicDeposit(
  apiPromise: ApiPromise,
  depositer: KeyringPair,
  treeId: number,
  output: Note
): Promise<[Note, Uint8Array]> {
  // Chain id from the note
  const outputChainId = BigInt(output.note.targetChainId);
  const secret = randomAsU8a();
  const { pk } = getKeys();

  // Creating two empty vanchor notes
  const input1 = await generateVAnchorNote(0, Number(outputChainId.toString()), Number(outputChainId.toString()), 0);
  const input2 = await input1.getDefaultUtxoNote();
  const publicAmount = BigInt(output.note.amount);
  const notes = [input1, input2];
  // Output UTXOs configs
  const output1 = new Utxo(output.note.getUtxo());
  const output2 = await Utxo.generateUtxo({
    curve: 'Bn254',
    backend: 'Arkworks',
    amount: '0',
    chainId
  });
  // Configure a new proving manager with direct call
  const provingManager = new ArkworksProvingManager(null);
  const leavesMap: any = {};

  const address = depositer.address;
  const extAmount = publicAmount;
  const fee = 0;
  // Empty leaves
  leavesMap[outputChainId.toString()] = [];
  const tree = await apiPromise!.query.merkleTreeBn254.trees(treeId);
  const root = tree.unwrap().root.toHex();
  const neighborRoots: string[] = await (apiPromise!.rpc as any).lt.getNeighborRoots(treeId).then((roots: any) => roots.toHuman());

  const rootsSet = [hexToU8a(root), hexToU8a(neighborRoots[0])];
  const decodedAddress = decodeAddress(address);
  const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
  const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

  const setup: ProvingManagerSetupInput<'vanchor'> = {
    chainId: outputChainId.toString(),
    indices: [0, 0],
    inputNotes: notes,
    leavesMap: leavesMap,
    output: [output1, output2],
    encryptedCommitments: [comEnc1, comEnc2],
    provingKey: pk,
    publicAmount: String(publicAmount),
    roots: rootsSet,
    relayer: decodedAddress,
    recipient: decodedAddress,
    extAmount: extAmount.toString(),
    fee: fee.toString(),
    refund: '0',
    token: decodedAddress
  };
  const data = await provingManager.prove('vanchor', setup) as VAnchorProof;
  const extData = {
    relayer: address,
    recipient: address,
    fee,
    extAmount: extAmount,
    refund: '0',
    token: address,
    encryptedOutput1: u8aToHex(comEnc1),
    encryptedOutput2: u8aToHex(comEnc2)
  };

  let vanchorProofData = {
    proof: `0x${data.proof}`,
    publicAmount: data.publicAmount,
    roots: rootsSet,
    inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
    outputCommitments: data.outputNotes.map(note => u8aToHex(note.note.getLeafCommitment())),
    extDataHash: data.extDataHash
  };
  const leafsCount = await apiPromise.derive.merkleTreeBn254.getLeafCountForTree(Number(treeId));
  const predictedIndex = leafsCount;

  await polkadotTx(apiPromise!, {
    section: 'vAnchorBn254',
    method: 'transact'
  }, [treeId, vanchorProofData, extData], depositer);

  const leaf1 = data.outputNotes[0].getLeaf();
  const indexOfLeaf1 = await getleafIndex(apiPromise, leaf1, predictedIndex, treeId);
  output.mutateIndex(String(indexOfLeaf1));
  return [output, secret];
}

async function basicWithdraw(
  api: ApiPromise,
  treeId: number,
  withdrawAccount: KeyringPair,
  inputNote: Note,
  secret: Uint8Array
) {
  const leavesMap = {} as any;
  const chainId = inputNote.note.targetChainId;
  const fee = 0;
  const { pk, vk } = getKeys();

  const withdrawAmount = inputNote.note.amount;
  const extAmount = -withdrawAmount;

  const publicAmount = -withdrawAmount;

  const output1 = await Utxo.generateUtxo({
    curve: 'Bn254',
    backend: 'Arkworks',
    amount: '0',
    chainId
  });
  const output2 = await Utxo.generateUtxo({
    curve: 'Bn254',
    backend: 'Arkworks',
    amount: '0',
    chainId
  });

  const provingManager = new ArkworksProvingManager(null);
  const address = withdrawAccount.address;
  const maxLeafIndex = Number(inputNote.note.index);
  const leafsCount = await apiPromise!.derive.merkleTreeBn254.getLeafCountForTree(Number(treeId));
  const leaves = await apiPromise!.derive.merkleTreeBn254.getLeavesForTree(treeId, 0, leafsCount -1);
  const neighborRoots: string[] = await (apiPromise!.rpc as any).lt.getNeighborRoots(treeId).then((roots: any) => roots.toHuman());

  leavesMap[chainId.toString()] = leaves;

  const tree = new MTBn254X5(leaves, String(maxLeafIndex));
  const root = `0x${tree.root}`;
  const neighborRoot = hexToU8a(neighborRoots[0]);
  const rootsSet = [hexToU8a(root), neighborRoot];
  const decodedAddress = decodeAddress(address);

  const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
  const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

  const setup: ProvingManagerSetupInput<'vanchor'> = {
    chainId: chainId.toString(),
    indices: [inputNote].map(({ note }) => Number(note.index)),
    inputNotes: [inputNote],
    leavesMap: leavesMap,
    output: [output1, output2],
    encryptedCommitments: [comEnc1, comEnc2],
    provingKey: pk,
    publicAmount: String(publicAmount),
    roots: rootsSet,
    relayer: decodedAddress,
    recipient: decodedAddress,
    extAmount: extAmount.toString(),
    fee: fee.toString(),
    refund: '0',
    token: decodedAddress
  };
  const data = await provingManager.prove('vanchor', setup) as VAnchorProof;
  const extData = {
    relayer: address,
    recipient: address,
    fee,
    extAmount: extAmount,
    refund: '0',
    token: address,
    encryptedOutput1: u8aToHex(comEnc1),
    encryptedOutput2: u8aToHex(comEnc2)
  };

  let vanchorProofData = {
    proof: `0x${data.proof}`,
    publicAmount: data.publicAmount,
    roots: rootsSet,
    inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
    outputCommitments: data.outputNotes.map(note => u8aToHex(note.getLeaf())),
    extDataHash: data.extDataHash
  };
  const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(vk).replace('0x', ''), 'Bn254');
  console.log(`isValidProof ${isValidProof}`);
  await polkadotTx(apiPromise!, {
    section: 'vAnchorBn254',
    method: 'transact'
  }, [treeId, vanchorProofData, extData], withdrawAccount);
}

async function createVAnchorWithDeposit(
  apiPromise: ApiPromise,
  sudo: KeyringPair,
  depositer: KeyringPair
): Promise<[number, [Note, Note], [Uint8Array, Uint8Array], Uint8Array]> {
  const treeId = await createVAnchor(apiPromise, sudo);
  const outputChainId = BigInt(chainId);
  const secret = randomAsU8a();
  const { pk, vk } = getKeys();

  // Creating two empty vanchor notes
  const note1 = await generateVAnchorNote(0, Number(outputChainId.toString()), Number(outputChainId.toString()), 0);
  const note2 = await note1.getDefaultUtxoNote();
  const publicAmount = currencyToUnitI128(10);
  const notes = [note1, note2];
  // Output UTXOs configs
  const output1 = await Utxo.generateUtxo({
    curve: 'Bn254',
    backend: 'Arkworks',
    amount: publicAmount.toString(),
    chainId
  });
  const output2 = await Utxo.generateUtxo({
    curve: 'Bn254',
    backend: 'Arkworks',
    amount: '0',
    chainId
  });
  // Configure a new proving manager with direct call
  const provingManager = new ArkworksProvingManager(null);
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
    inputNotes: notes,
    leavesMap: leavesMap,
    output: [output1, output2],
    encryptedCommitments: [comEnc1, comEnc2],
    provingKey: pk,
    publicAmount: String(publicAmount),
    roots: rootsSet,
    relayer: decodedAddress,
    recipient: decodedAddress,
    extAmount: extAmount.toString(),
    fee: fee.toString(),
    refund: '0',
    token: decodedAddress
  };
  const data = await provingManager.prove('vanchor', setup) as VAnchorProof;
  const extData = {
    relayer: address,
    recipient: address,
    fee,
    extAmount: extAmount,
    refund: '0',
    token: address,
    encryptedOutput1: u8aToHex(comEnc1),
    encryptedOutput2: u8aToHex(comEnc2)
  };

  let vanchorProofData = {
    proof: `0x${data.proof}`,
    publicAmount: data.publicAmount,
    roots: rootsSet,
    inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
    outputCommitments: data.outputNotes.map(note => u8aToHex(note.note.getLeafCommitment())),
    extDataHash: data.extDataHash
  };
  const leafsCount = await apiPromise.derive.merkleTreeBn254.getLeafCountForTree(Number(treeId));
  const predictedIndex = leafsCount;

  await polkadotTx(apiPromise!, {
    section: 'vAnchorBn254',
    method: 'transact'
  }, [treeId, vanchorProofData, extData], depositer);

  const leaf1 = data.outputNotes[0].getLeaf();
  const leaf2 = data.outputNotes[1].getLeaf();
  const indexOfLeaf1 = await getleafIndex(apiPromise, leaf1, predictedIndex, treeId);
  const indexOfLeaf2 = await getleafIndex(apiPromise, leaf2, predictedIndex, treeId);
  const note1WithIndex = data.outputNotes[0];
  note1WithIndex.mutateIndex(String(indexOfLeaf1));
  const note2WithIndex = data.outputNotes[1];
  note2WithIndex.mutateIndex(String(indexOfLeaf2));

  return [treeId, [note1WithIndex, note2WithIndex], [pk, vk], secret];
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
  const leaves = await api.derive.merkleTreeBn254.getLeavesForTree(Number(treeId), 0, leafCount - 1);
  const leafHex = u8aToHex(leaf);
  const shiftedIndex = leaves.findIndex(leaf => u8aToHex(leaf) === leafHex);

  if (shiftedIndex === -1) {
    throw new Error(`Leaf isn't in the tree`);
  }
  // return indexBeforeInsertion + shiftedIndex;
  return shiftedIndex;
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
    const chainIdentifier = apiPromise.consts.linkableTreeBn254.chainIdentifier.toString();
    chainId = String(calculateTypedChainId(ChainType.Substrate, Number(chainIdentifier)));
  });

  it('VAnchor deposit', async function() {
    console.log('keyring');
    const { bob, alice } = getKeyring();
    const secret = randomAsU8a();

    // ChainId
    const outputChainId = BigInt('2199023256632');
    const { pk } = getKeys();


    const treeId = await createVAnchor(apiPromise!, alice);

    // Creating two empty vanchor notes
    const note1 = await generateVAnchorNote(0, Number(outputChainId.toString()), Number(outputChainId.toString()), 0);
    const note2 =await note1.getDefaultUtxoNote();
    console.log('notes ready')
    const publicAmount = currencyToUnitI128(10);
    const notes = [note1, note2];
    // Output UTXOs configs
    const output1 = await Utxo.generateUtxo({
      curve: 'Bn254',
      backend: 'Arkworks',
      amount: publicAmount.toString(),
      chainId,
      keypair: new Keypair()
    });
    const output2 = await Utxo.generateUtxo({
      curve: 'Bn254',
      backend: 'Arkworks',
      amount: '0',
      chainId,
      keypair: new Keypair()
    });
    // Configure a new proving manager with direct call
    const provingManager = new ArkworksProvingManager(null);
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
      inputNotes: notes,
      leavesMap: leavesMap,
      output: [output1, output2],
      encryptedCommitments: [comEnc1, comEnc2],
      provingKey: pk,
      publicAmount: String(publicAmount),
      roots: rootsSet,
      relayer: decodedAddress,
      recipient: decodedAddress,
      extAmount: extAmount.toString(),
      fee: fee.toString(),
      refund: '0',
      token: decodedAddress
    };
  const data = await provingManager.prove('vanchor', setup) as VAnchorProof;
    const extData = {
      relayer: address,
      recipient: address,
      fee,
      extAmount: extAmount,
      refund: '0',
      token: address,
      encryptedOutput1: u8aToHex(comEnc1),
      encryptedOutput2: u8aToHex(comEnc2),
    };

    let vanchorProofData = {
      proof: `0x${data.proof}`,
      publicAmount: data.publicAmount,
      roots: rootsSet,
      inputNullifiers: data.inputUtxos.map((input) => `0x${input.nullifier}`),
      outputCommitments: data.outputNotes.map((note) => u8aToHex(note.getLeaf())),
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

    const [treeId, notes, [pk], secret] = await createVAnchorWithDeposit(apiPromise!, alice, bob);
    const chainId = notes[0].note.targetChainId; // both two notes have the same chain id

    const withdrawAmount = notes.reduce((acc, note) => acc + Number(note.note.amount), 0);
    const extAmount = -withdrawAmount;

    const publicAmount = -withdrawAmount;

    const output1 = await Utxo.generateUtxo({
      curve: 'Bn254',
      backend: 'Arkworks',
      amount: '0',
      chainId
    });
    const output2 = await Utxo.generateUtxo({
      curve: 'Bn254',
      backend: 'Arkworks',
      amount: '0',
      chainId
    });

    const provingManager = new ArkworksProvingManager(null);
    const address = bob.address;
    const leaf1Index = Number(notes[0].note.index);
    const leaf2Index = Number(notes[1].note.index);
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
      inputNotes: notes,
      leavesMap: leavesMap,
      output: [output1, output2],
      encryptedCommitments: [comEnc1, comEnc2],
      provingKey: pk,
      publicAmount: String(publicAmount),
      roots: rootsSet,
      relayer: decodedAddress,
      recipient: decodedAddress,
      extAmount: extAmount.toString(),
      fee: fee.toString(),
      refund: '0',
      token: decodedAddress
    };
    const data = await provingManager.prove('vanchor', setup) as VAnchorProof;
    const extData = {
      relayer: address,
      recipient: address,
      fee,
      extAmount: extAmount,
      refund: '0',
      token: address,
      encryptedOutput1: u8aToHex(comEnc1),
      encryptedOutput2: u8aToHex(comEnc2)
    };

    let vanchorProofData = {
      proof: `0x${data.proof}`,
      publicAmount: data.publicAmount,
      roots: rootsSet,
      inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
      outputCommitments: data.outputNotes.map(note => u8aToHex(note.getLeaf())),
      extDataHash: data.extDataHash
    };

    await polkadotTx(apiPromise!, {
      section: 'vAnchorBn254',
      method: 'transact'
    }, [treeId, vanchorProofData, extData], bob);
  });

  it('VAnchor deposit and withdraw with only one note', async function() {
    const { bob, alice } = getKeyring();
    const fee = 0;
    const leavesMap: any = {};

    const [treeId, notesRaw, [pk, vk], secret] = await createVAnchorWithDeposit(apiPromise!, alice, bob);
    // Ignoring the second note which is for a default UTXO
    const notes = [notesRaw[0]];
    const chainId = notes[0].note.targetChainId;

    const withdrawAmount = notes.reduce((acc, note) => acc + Number(note.note.amount), 0);
    const extAmount = -withdrawAmount;

    const publicAmount = -withdrawAmount;

    const output1 = await Utxo.generateUtxo({
      curve: 'Bn254',
      backend: 'Arkworks',
      amount: '0',
      chainId
    });
    const output2 = await Utxo.generateUtxo({
      curve: 'Bn254',
      backend: 'Arkworks',
      amount: '0',
      chainId
    });

    const provingManager = new ArkworksProvingManager(null);
    const address = bob.address;
    const maxLeafIndex = Number(notes[0].note.index);
    const leaves = await apiPromise!.derive.merkleTreeBn254.getLeavesForTree(treeId, 0, maxLeafIndex);
    const neighborRoots: string[] = await (apiPromise!.rpc as any).lt.getNeighborRoots(treeId).then((roots: any) => roots.toHuman());

    leavesMap[chainId.toString()] = leaves;
    const tree = new MTBn254X5(leaves, '0');
    const root = `0x${tree.root}`;
    const rootsSet = [hexToU8a(root), hexToU8a(neighborRoots[0])];
    const decodedAddress = decodeAddress(address);

    const { encrypted: comEnc1 } = naclEncrypt(output1.commitment, secret);
    const { encrypted: comEnc2 } = naclEncrypt(output2.commitment, secret);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: chainId.toString(),
      indices: notes.map(({ note }) => Number(note.index)),
      inputNotes: notes,
      leavesMap: leavesMap,
      output: [output1, output2],
      encryptedCommitments: [comEnc1, comEnc2],
      provingKey: pk,
      publicAmount: String(publicAmount),
      roots: rootsSet,
      relayer: decodedAddress,
      recipient: decodedAddress,
      extAmount: extAmount.toString(),
      fee: fee.toString(),
      refund: '0',
      token: decodedAddress
    };
    const data = await provingManager.prove('vanchor', setup) as VAnchorProof;
    const extData = {
      relayer: address,
      recipient: address,
      fee,
      extAmount: extAmount,
      refund: '0',
      token: address,
      encryptedOutput1: u8aToHex(comEnc1),
      encryptedOutput2: u8aToHex(comEnc2)
    };

    let vanchorProofData = {
      proof: `0x${data.proof}`,
      publicAmount: data.publicAmount,
      roots: rootsSet,
      inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
      outputCommitments: data.outputNotes.map(note => u8aToHex(note.getLeaf())),
      extDataHash: data.extDataHash
    };
    const isValidProof = verify_js_proof(data.proof, data.publicInputs, u8aToHex(vk).replace('0x', ''), 'Bn254');
    console.log(`isValidProof ${isValidProof}`);
    await polkadotTx(apiPromise!, {
      section: 'vAnchorBn254',
      method: 'transact'
    }, [treeId, vanchorProofData, extData], bob);
  });

  it('VAnchor multi deposits single execution', async function() {
    this.timeout(350_000);

    const numberOfDepoisits = 10;
    const { bob, alice } = getKeyring();
    const treeId = await createVAnchor(apiPromise!, alice);
    for (let i = 0; i < numberOfDepoisits; i++) {
      const note = await generateVAnchorNote(Number(currencyToUnitI128(100).toString()), Number(chainId), Number(chainId));
      await basicDeposit(apiPromise!, bob, treeId, note);
    }
  });

  it('VAnchor multi deposits and withdraw', async function() {
    const numberOfDepoisits = 3;
    this.timeout(350_000);
    const { bob, alice } = getKeyring();
    const treeId = await createVAnchor(apiPromise!, alice);
    for (let i = 0; i < numberOfDepoisits; i++) {
      const note = await generateVAnchorNote(Number(currencyToUnitI128(100).toString()), Number(chainId), Number(chainId));
      const [outputNote, secret] = await basicDeposit(apiPromise!, bob, treeId, note);
      await basicWithdraw(apiPromise!, treeId, bob, outputNote, secret);
    }
  });

  after(async function() {
    await apiPromise?.disconnect();
    await nodes?.();
  });
});
