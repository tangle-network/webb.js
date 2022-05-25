import { JsNoteBuilder, OutputUtxoConfig, setupKeys } from '@webb-tools/wasm-utils/njs/wasm-utils-njs.js';
import { ApiPromise } from '@polkadot/api';
import { decodeAddress, Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import { KillTask, preparePolkadotApi, startWebbNode, transferBalance } from '../../utils/index.js';
import { ProvingManagerSetupInput, ProvingManagerWrapper } from '@webb-tools/sdk-core';
import { getExtDataHash } from '@webb-tools/utils/src/utils';
import { u8aToHex } from '@polkadot/util';

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
    charlie,
  };
  return keyring;
}
function generateVAnchorNote (amount: number, chainId: number, outputChainId: number, index?: number) {
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


describe("VAnchor tests" , function() {
  before(async function () {
    // If LOCAL_NODE is set the tests will continue  to use the already running node
    nodes = startWebbNode();
    apiPromise = await preparePolkadotApi();
  });


  it("VAnchor deposit" ,async function(){
    const { bob, charlie, alice } = getKeyring();
    // transfer some funds to sudo & test account
    const keys = vanchorBn2542_2_2;
    const outputChainId = BigInt(0);

    console.log(`Transferring 10,000 balance to Alice and Bob`);
    await transferBalance(apiPromise!, charlie, [alice, bob], 10_000);

    const note1 = generateVAnchorNote(0,0,0,0);
    const note2= note1.defaultUtxoNote();
    const publicAmount = -7;
    const notes = [note1,note2];
    const outputConfig1 = new OutputUtxoConfig('100', undefined,outputChainId );
    const outputConfig2 = new OutputUtxoConfig('0', undefined, outputChainId);

    const provingManager = new ProvingManagerWrapper('direct-call');
    const leavesMap: any = {};

    const recipient = u8aToHex(decodeAddress(alice.address));
    const relayer = u8aToHex(decodeAddress(alice.address));
    const extAmount = -5;
    const fee = 2;
    const externalDataHash = getExtDataHash({
      recipient:recipient.replace('0x',''),
      relayer:relayer.replace('0x', ''),
      extAmount,
      fee,
      encryptedOutput1:"",
      encryptedOutput2:"",
    });

    leavesMap[0] = notes.map(i => i.getLeafCommitment());
    const setup: ProvingManagerSetupInput<'vanchor'> = {
      chainId: '0',
      externalDataHash:externalDataHash.toString(),
      indices: [0,0],
      inputNotes: notes.map((note) => note.serialize()),
      leavesMap: leavesMap,
      outputConfigs: [outputConfig1, outputConfig2],
      provingKey: keys.pk,
      publicAmount: String(publicAmount),
      roots: []
    };
    const data = await provingManager.proof('vanchor', setup);


  })
})
