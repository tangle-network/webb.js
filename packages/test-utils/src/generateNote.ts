import {JsNoteBuilder} from "@webb-tools/wasm-utils/njs";
import {Note} from "@webb-tools/sdk-core";

export function generateMixerNote(amount: number, chainId: number, outputChainId: number) {
  let noteBuilder = new JsNoteBuilder();
  noteBuilder.protocol('mixer');
  noteBuilder.version('v1');

  noteBuilder.sourceChainId(String(chainId));
  noteBuilder.targetChainId(String(outputChainId));
  noteBuilder.sourceIdentifyingData('3');
  noteBuilder.targetIdentifyingData('3');

  noteBuilder.tokenSymbol('WEBB');
  noteBuilder.amount(String(amount));
  noteBuilder.denomination('18');

  noteBuilder.backend('Arkworks');
  noteBuilder.hashFunction('Poseidon');
  noteBuilder.curve('Bn254');
  noteBuilder.width('3');
  noteBuilder.exponentiation('5');
  const note = noteBuilder.build();

  return note;
}

export async function generateVAnchorNote(amount: number, chainId: number, outputChainId: number, index?: number) {
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
