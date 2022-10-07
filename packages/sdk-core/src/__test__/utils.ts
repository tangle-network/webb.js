import { Note, Utxo } from '../index.js';

export async function generateArkworksVAnchorNote (inputUtxo: Utxo) {
  const note = await Note.generateNote({
    amount: String(inputUtxo.amount),
    backend: 'Arkworks',
    curve: 'Bn254',
    denomination: String(18),
    exponentiation: String(5),
    hashFunction: 'Poseidon',
    index: inputUtxo.index,
    protocol: 'vanchor',
    secrets: inputUtxo.getSecretsForNote().join(':'),
    sourceChain: String(inputUtxo.chainId),
    sourceIdentifyingData: '1',
    targetChain: String(inputUtxo.chainId),
    targetIdentifyingData: '1',
    tokenSymbol: 'WEBB',
    version: 'v1',
    width: String(5)
  });

  return note;
}
