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

        const note = await Note.deserialize('webb://v2:anchor/2199023256632:2199023256632/0:3/3804000000020000:70eb3ff23239ac0a259a59c6d928a6c84dc04e3345469aa9aa8906d29f075007:76e0abdd41b84238697b2c0d3a5e7265e774fcb192f11e6a713935907726d826/?curve=Bn254&width=4&exp=5&hf=Poseidon&backend=Arkworks&token=WEBB&denom=18&amount=10')
        const noteString = note.serialize();

        const newInput: ProvingManagerSetupInput = {
            fee: 0,
            leafIndex: 0,
            leaves: [note.getLeaf()],
            note: noteString,
            refund: 0,
            provingKey: pk,
            relayer: '0',
            recipient: '0',
            commitment: '3804000000020000:70eb3ff23239ac0a259a59c6d928a6c84dc04e3345469aa9aa8906d29f075007:76e0abdd41b84238697b2c0d3a5e7265e774fcb192f11e6a713935907726d826',
        }
        const Proof = new ProvingManagerWrapper()
        const proof = await Proof.proof(newInput)
        // dont know how proof looks like yet :)
        expect(proof.nullifierHash).toContain("0x")
    })
})