import { execSync, spawn, SpawnOptionsWithoutStdio } from 'child_process';
import {sleep} from "./index";

function spawnWithLogger(
  command: string,
  options?: SpawnOptionsWithoutStdio,
  allLogs = false
) {
  const process = spawn(command, options);

  if (allLogs) {
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  }

  process.on('close', (code) => {
    console.log(` process ${process.pid} exited with code ${code}`);
  });

  return process;
}
export type KillTask = () => void;
export function startDarkWebbNode(): KillTask {
  execSync(
    'docker pull ghcr.io/webb-tools/protocol-substrate-standalone-node:edge',
    { stdio: 'inherit' }
  );
  const DOCKER_NETWORK_NAME = 'webb-network'
  try{
    execSync(`docker network create -d bridge ${DOCKER_NETWORK_NAME}`)
  }catch (e) {
    console.log((e as any)?.toString());
  }
  const node1 =
    'webb-standalone-node  --dev --alice --node-key 0000000000000000000000000000000000000000000000000000000000000001 --ws-port=9944 --rpc-cors all --ws-external';
  const node2 =
    'webb-standalone-node --dev --bob --port 33334 --tmp --bootnodes /ip4/127.0.0.1/tcp/30333/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp --ws-port=9993';

  const getDockerCmd = (cmd: string, ports: number[]) => {
    return `docker run --network ${DOCKER_NETWORK_NAME}  --rm ${ports.reduce(
      (acc, port) => `${acc} -p ${port}:${port}`,
      ''
    )} ghcr.io/webb-tools/protocol-substrate-standalone-node:edge  ${cmd}`;
  };

  const node1Cmd = getDockerCmd(node1, [9944, 30333]);
  const node2Cmd = getDockerCmd(node2, [33334, 33334]);

  const node1Task = spawnWithLogger(node1Cmd, {
    shell: true,
  });
  const node2task = spawnWithLogger(node2Cmd, {
    shell: true,
  });
  return async () => {
    node1Task.kill('SIGINT');
    node2task.kill('SIGINT');
    await sleep(2000);
    execSync(`docker network rm ${DOCKER_NETWORK_NAME}`)
  };
}
