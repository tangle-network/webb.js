const api = require('@polkadot/api');
const { ApiPromise, Keyring, WsProvider } = api;
const options = require('@webb-tools/api').options;
const LoggerService = require('@webb-tools/app-util');
const sdk = require('@webb-tools/sdk-mixer');
const { Note } = sdk;

// @ts-ignore
const Worker = require('./mixer.worker');

const ENDPOINT = 'ws://localhost:9944';
const apiLogger = new LoggerService.LoggerService('Api');

async function main() {
  apiLogger.info('Connecting to ', ENDPOINT);
  const provider = new WsProvider([ENDPOINT]);
  console.log(options);
  const opts = options({ provider });
  const api = await ApiPromise.create(opts);
  const result = await api.rpc.system.chain();
  apiLogger.info('🎉 Connected to ', result.toHuman());
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice', { name: 'Alice default' });
  console.log(Note);
  const note = await Note.generateNote({
    prefix: 'webb.mix',
    version: 'v1',
    chain: 'ETH',
    backend: 'Arkworks',
    hashFunction: 'Poseidon',
    curve: 'Bn254',
    tokenSymbol: 'webbETH-edg-eth-opt-arb-1',
    amount: '10',
    denomination: '18',
  });

  const leaf = note.getLeaf();
  apiLogger.info(`Your Note: ${note.serialize()}`);
  apiLogger.info(`Your leaf: ${leaf}`);
  console.log(api.query, api.tx);
  // @ts-ignore
  api.query.system.account(alice.address).then((account) => {
    console.log(account);
  });
}

// const setup = async () => {
//   const worker = new Worker();
//   const mixer = await Mixer.init(worker);
//   let noteStr =
//     'webb.mix:v1:any:Arkworks:Bn254:Poseidon17:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717';
//   const leaves = [];
//   const proof = await mixer.generateZKP({
//     noteString: noteStr,
//     leaves,
//     relayer: '0x929E7eb6997408C196828773db642D76e79bda93',
//     recipient: '0x929E7eb6997408C196828773db642D76e79bda93',
//     fee: 0,
//     refund: 0
//   });
//   console.log(proof);
// };

// setup();
main();
