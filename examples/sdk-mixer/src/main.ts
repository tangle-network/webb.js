import { options } from '@webb-tools/api';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { LoggerService } from '@webb-tools/app-util';
import { Mixer } from '@webb-tools/sdk-mixer';

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

main().catch(apiLogger.error);
