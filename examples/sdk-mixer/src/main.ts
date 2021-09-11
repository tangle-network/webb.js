import { options } from '@webb-tools/api';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';
import { LoggerService } from '@webb-tools/app-util';
import { Mixer, Note } from '@webb-tools/sdk-mixer/index';

// @ts-ignore
import Worker from './mixer.worker';

const ENDPOINT = 'ws://localhost:9944';
const apiLogger = LoggerService.get('Api');

async function main() {
  apiLogger.info('Connecting to ', ENDPOINT);
  const provider = new WsProvider([ENDPOINT]);
  const opts = options({ provider });
  const api = await ApiPromise.create(opts);
  const result = await api.rpc.system.chain();
  apiLogger.info('🎉 Connected to ', result.toHuman());
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice', { name: 'Alice default' });

  const mixer = await Mixer.init(new Worker());
  const [note, leaf] = await mixer.generateNoteAndLeaf({ id: 0, tokenSymbol: 'EDG' });
  apiLogger.info(`Your Note: ${note.serialize()}`);
  await api.tx.mixer.deposit(0, [leaf]).signAndSend(alice, async ({ status, dispatchError }) => {
    // status would still be set, but in the case of error we can shortcut
    // to just check it (so an error would indicate InBlock or Finalized)
    if (dispatchError) {
      if (dispatchError.isModule) {
        // for module errors, we have the section indexed, lookup
        const decoded = api.registry.findMetaError(dispatchError.asModule);
        const { documentation, name, section } = decoded;

        console.log(`${section}.${name}: ${documentation.join(' ')}`);
      } else {
        // Other, CannotLookup, BadOrigin, no extra info
        apiLogger.error(dispatchError.toString());
      }
    }
    if (status.isInBlock || status.isFinalized) {
      apiLogger.info('Done!');
      await api.disconnect();
    }
  });
}

const setup = async () => {
  const worker = new Worker();
  const mixer = await Mixer.init(worker);
  let noteStr =
    'webb.mix:v1:any:Arkworks:Bn254:Poseidon17:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717';
  const proof = await mixer.generateZK({
    note: noteStr,
    root: new Uint8Array(Buffer.from('0x0000000000000000000000000000000000000000000000000000000000000000', 'hex')),
    leaves: [],
    relayer: new Uint8Array(Buffer.from('0x929E7eb6997408C196828773db642D76e79bda93', 'hex')),
    recipient: new Uint8Array(Buffer.from('0x929E7eb6997408C196828773db642D76e79bda93', 'hex')),
  });
  console.log(proof);
};
setup();
