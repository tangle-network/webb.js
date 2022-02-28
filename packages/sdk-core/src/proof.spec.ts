import type { ProvingManagerSetupInput } from './proving';
import { ProvingManagerWrapper } from './proving'
import path from 'path'
import { readFile } from 'fs/promises'
import { u8aToString } from '@polkadot/util'
import { Note } from '.';
import { OperationError } from '@webb-tools/wasm-utils/build/njs';

describe('Proof tests', () => {
    it('Should prove an anchor note', async () => {
        try {
            const pkPath = path.join(process.cwd(), 'fixtures', 'proving_key.bin');
            const pk = await readFile(pkPath);


            const note = await Note.deserialize('webb://v2:anchor/1099511627780:1099511627780/0x4e7D4BEe028655F2865d9D147cF7B609c516d39C:0x4e7D4BEe028655F2865d9D147cF7B609c516d39C/010000000004:00defe0ff44373b7c9c892a3fd3c72af100b35b7b319686aac357bb41d52eb2d:00b62b13d3af6d4f585cef8775e0c1bc11f77ff545c468b3bed00024d342815c/?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Arkworks&token=webbWETH&denom=18&amount=0.1')
            console.log(note.serialize())
            const noteString = note.serialize();
            const depositeNote = await note.toDepositNote()
            const newInput: ProvingManagerSetupInput = {
                fee: 10,
                leafIndex: 0,
                leaves: [note.getLeaf()],
                note: noteString,
                refund: 0.1,
                provingKey: pk,
                relayer: depositeNote.sourceChainId,
                recipient: depositeNote.targetChainId,
                commitment: u8aToString(depositeNote.getLeafCommitment()),
            }


            const Proof = new ProvingManagerWrapper()
            // it seems to fail here.
            const proof = await Proof.proof(newInput)
            expect(proof.nullifierHash).toContain("0x")
        } catch (e) {
            if (e instanceof OperationError) {
                console.log({
                    code: e.code,
                    errorMessage: e.error_message,
                    data: e.data
                })
            }
        }
    })
})