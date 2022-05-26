import { ExtData, JsNoteBuilder, OutputUtxoConfig, setupKeys } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { ApiPromise } from '@polkadot/api';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { ethers } from 'ethers';
import { KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import { ProvingManagerSetupInput, ProvingManagerWrapper } from '@webb-tools/sdk-core/index.js';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { addressToEvm } from '@polkadot/util-crypto';
import { polkadotTx } from '@webb-tools/test-utils/index.js';

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

const vanchorBn2542_2_2 = setupKeys('vanchor', 'Bn254', 2, 2, 2);

console.log({
  evm:u8aToHex(addressToEvm("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")),
  substrate:"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  decoded:u8aToHex(decodeAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"))
});

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
    const keys = vanchorBn2542_2_2;
    const outputChainId = BigInt(0);

    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);
    const treeId = await createVAnchor(apiPromise!, alice);


    const note1 = generateVAnchorNote(0, 0, 0, 0);
    const note2 = note1.defaultUtxoNote();
    const publicAmount = 10;
    const notes = [note1, note2];
    const outputConfig1 = new OutputUtxoConfig('10', undefined, outputChainId);
    const outputConfig2 = new OutputUtxoConfig('0', undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const leavesMap: any = {};

    const address = alice.address;
    const extAmount = 10;
    const fee = 0;
    leavesMap[0] = [];
    const tree = await apiPromise!.query.merkleTreeBn254.trees(treeId);
    const root = tree.unwrap().root.toHex();
    const rootsSet = [hexToU8a(root), hexToU8a(root)];
    let extdata: any = null;
    let hash :any= null
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      calcExtHash([o1, o2]): string {
        let deocdedAddress = decodeAddress(address);
        extdata = {
          relayer:deocdedAddress,
          recipient:deocdedAddress,
          fee,
          ext_amount: extAmount,
          encrypted_output1: o1.commitment,
          encrypted_output2: o2.commitment
        }
        const extData2 = new ExtData(deocdedAddress,deocdedAddress,extAmount.toString(),fee.toString(),
          o1.commitment,
          o2.commitment
          )
       hash = ethers.utils.keccak256(extData2.get_encode());
        return hash.replace('0x', '');
      },
      indices: [0, 0],
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      roots: rootsSet
    };
    const data = await provingManager.proof('vanchor', setup);
    let vanchorTxPayloda = {
      proof: `0x${data.proof}`,
      public_amount: data.publicAmount,
      roots: rootsSet,
      input_nullifiers: data.inputUtxos.map(input => `0x${input.nullifier}`),
      output_commitments: data.outputNotes.map(note => note.getLeafCommitment()),
      ext_data_hash:hash
    };
    console.log([treeId, vanchorTxPayloda, extdata]);
    try{


    await polkadotTx(apiPromise!, {
      section: 'vAnchorBn254',
      method: 'transact'
    }, [treeId, vanchorTxPayloda,extdata], bob);

    }catch (e) {
      console.log(e);
      throw e
    }
  });

  after(async function() {
    await nodes?.();
  });
});
