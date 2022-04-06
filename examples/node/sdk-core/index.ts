import { Note, NoteGenInput, u8aToHex} from '@webb-tools/sdk-core/build/index.js';
import {preparePolkadotApi, transferBalance} from "../utils.js";
import {Keyring} from "@polkadot/keyring";
import {polkadotTx} from "../../../tests/utils/index.js";


async function main(){
  const BOBPhrase =
    'asthma early danger glue satisfy spatial decade wing organ bean census announce';
  const k = new Keyring({ type: 'sr25519' });
  const bob = k.addFromMnemonic(BOBPhrase);
  const charlie = k.addFromUri('//Charlie');
  // API promise inlining
  const apiPromise = await preparePolkadotApi();
  console.info(`[ mixerBn254 ]Prepared the api promise`);
  // Transfer balance for BOB from Charlie
  await transferBalance(apiPromise,charlie,[bob] , 10000);
  console.info(`[ mixerBn254 ] Transferred the balance to Bob`);
  // => Depositing with bob account <=
  // Fill in the note Generate input
  const noteGenInput:NoteGenInput = {
    protocol:'mixer',
    version:'v2',
    sourceChain:"1",
    targetChain:"1",
    amount:"1",
    tokenSymbol:"WEBB",
    sourceIdentifyingData:"3",
    targetIdentifyingData:'3',
    denomination:"18",
    backend:"Arkworks",
    hashFunction:"Poseidon",
    curve:"Bn254",
    width:'3',
    exponentiation:"5"
  }
  // Generate deposit note
  const note = await Note.generateNote(noteGenInput)
  const leaf = note.getLeaf();
  console.info(`[ mixerBn254 ] Note generate the leaf is ${u8aToHex(leaf)}`);
  // Do the transaction for depositing
  await polkadotTx(
    apiPromise,
    { section: 'mixerBn254', method: 'deposit' },
    [0, leaf],
    bob
  );
  console.log(`[ mixerBn254 ] Deposit is Done successfully`);

  // Withdraw


}


main()
.catch(e =>{
  console.error(e);
})
