import {
  JsNoteBuilder,
  OutputUtxoConfig,
  verify_js_proof
} from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { ApiPromise } from '@polkadot/api';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { currencyToUnitI128, KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import { ProvingManagerSetupInput, ProvingManagerWrapper } from '@webb-tools/sdk-core/index.js';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { polkadotTx } from '@webb-tools/test-utils/index.js';
import path from 'path';
import fs from 'fs';

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

function generateVAnchorNote(amount: number, chainId: number, outputChainId: number, index?: number) {
  const noteBuilder = new JsNoteBuilder();

  noteBuilder.protocol('vanchor');
  noteBuilder.version('v2');
  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');

  noteBuilder.sourceChainId(String(chainId));
  noteBuilder.targetChainId(String(outputChainId));
  noteBuilder.width(String(5));
  noteBuilder.exponentiation(String(5));
  noteBuilder.denomination(String(18));
  noteBuilder.amount(String(amount));
  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.targetIdentifyingData('');
  noteBuilder.sourceIdentifyingData('');
  const note = noteBuilder.build();

  if (index !== undefined) {
    note.mutateIndex(String(index));
  }

  return note;
}


describe('VAnchor tests', function() {
  this.timeout(120_000)
  before(async function() {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
  });

  async function createVAnchor(apiPromise: ApiPromise, singer: KeyringPair): Promise<number> {
    await polkadotTx(apiPromise, {
      section: 'sudo',
      method: 'sudo'
    }, [apiPromise.tx.vAnchorBn254.create(1, 30, 0)], singer);
    const nextTreeId = await apiPromise?.query.merkleTreeBn254.nextTreeId();
    return nextTreeId.toNumber() - 1;
  };

  it.only('VAnchor deposit', async function() {
    const { bob, charlie, alice } = getKeyring();
    // transfer some funds to sudo & test account
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
    const pk = hexToU8a(pk_hex)

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
    const vk_hex = fs.readFileSync(vkPath).toString('hex');
    const vk = hexToU8a(vk_hex)
    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
    const treeId = await createVAnchor(apiPromise!, alice);


    const note1 = generateVAnchorNote(0, 2199023256632, 2199023256632, 0).defaultUtxoNote();
    const note2 = note1.defaultUtxoNote();
    const publicAmount = currencyToUnitI128(10);
    const notes = [note1, note2];
    const outputConfig1 = new OutputUtxoConfig(publicAmount.toString(), undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig('0', undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const leavesMap: any = {};

    const address = alice.address;
    const extAmount = currencyToUnitI128(10);
    const fee = 0;
    leavesMap[outputChainId.toString()] = [];
    const tree = await apiPromise!.query.merkleTreeBn254.trees(treeId);
    const root = tree.unwrap().root.toHex();
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    const decodedAddress = decodeAddress(address);

    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: outputChainId.toString(),
      indices: [0, 0],
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: pk,
      publicAmount: String(publicAmount),
      roots: rootsSet,
      relayer:decodedAddress,
      recipient:decodedAddress,
      extAmount:extAmount.toString(),
      fee:fee.toString(),
    };
    const data = await provingManager.proof('vanchor', setup);
    const extData =         {
      relayer:address,
      recipient:address,
      fee,
      ext_amount: extAmount,
      encrypted_output1: data.outputNotes[0].getLeafCommitment(),
      encrypted_output2: data.outputNotes[1].getLeafCommitment()
    }
    const validProof = verify_js_proof(
      data.proof,
      data.publicInputs,
      u8aToHex(vk).replace('0x' , ''),
      'Bn254'
    )
    console.log(`is Valid proof ${validProof}`);
    let vanchorProofData = {
      proof: `0x${data.proof}`,
      publicAmount: data.publicAmount,
      roots: rootsSet,
      inputNullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
      outputCommitments: data.outputNotes.map(note => u8aToHex(note.getLeafCommitment())),
      extDataHash: data.extDataHash
    };
    console.log([treeId, vanchorProofData, extData]);
    try{


    await polkadotTx(apiPromise!, {
      section: 'vAnchorBn254',
      method: 'transact'
    }, [treeId, vanchorProofData,extData], bob);

    }catch (e) {
      console.log(e);
      throw e
    }
  });

  after(async function() {
    await nodes?.();
  });
});
