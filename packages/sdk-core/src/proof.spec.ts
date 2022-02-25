import type { ProvingManagerSetupInput } from './proving';
import { ProvingManagerWrapper } from './proving'
import path from 'path'
import { readFile } from 'fs/promises'
// import { ApiPromise, WsProvider } from '@polkadot/api'
import { Note } from '.';

describe('Proof tests', () => {
    it('Should generate a new proof', async () => {
        // const wsProvider = new WsProvider('ws://127.0.0.1:9944');
        // const _api = await ApiPromise.create({ provider: wsProvider })
        const pkPath = path.join(process.cwd(), 'fixtures', 'proving_key.bin');
        const pk = await readFile(pkPath);

        const note = await Note.deserialize('webb://v2:anchor/1099511627780:1099511627780/0x4e7D4BEe028655F2865d9D147cF7B609c516d39C:0x4e7D4BEe028655F2865d9D147cF7B609c516d39C/010000000004:00defe0ff44373b7c9c892a3fd3c72af100b35b7b319686aac357bb41d52eb2d:00b62b13d3af6d4f585cef8775e0c1bc11f77ff545c468b3bed00024d342815c/?curve=Bn254&width=3&exp=5&hf=Poseidon&backend=Circom&token=webbWETH&denom=18&amount=0.1')
        const noteString = note.serialize();
        const newInput: ProvingManagerSetupInput = {
            fee: 10,
            leafIndex: 1,
            leaves: [note.getLeaf()],
            note: noteString,
            refund: 0.1,
            provingKey: pk,
            relayer: '0x9fe76e5833db2ba72b3a3b4b297ce36279bee41f7fc403d057dbe664d3c2b96b',
            recipient: '0x9fe76e5833db2ba72b3a3b4b297ce36279bee41f7fc403d057dbe664d3c2b96b',
            commitment: '10',
        }
        const Proof = new ProvingManagerWrapper()
        const proof = await Proof.proof(newInput)
        // dont know how proof looks like yet :)
        expect(proof.nullifierHash).toContain("0x")
    })
})