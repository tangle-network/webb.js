import {LocalProtocolSubstrate, UsageMode} from "@webb-tools/test-utils";
import isCi from "is-ci";
import path from "path";
import {ApiPromise} from "@polkadot/api";

const usageMode: UsageMode = isCi
  ? { mode: 'docker', forcePullImage: false }
  : {
    mode: 'host',
    nodePath: path.resolve(
      '../protocol-substrate/target/release/webb-standalone-node'
    ),
  };

let aliceNode: LocalProtocolSubstrate;
let bobNode: LocalProtocolSubstrate;

let apiPromise: ApiPromise | null = null;

export async function startWebbNodes(): Promise<ApiPromise>  {
  const aliceManualPorts = { ws: 9944, http: 9933, p2p: 30333 };
  const bobManualPorts = { ws: 9945, http: 9934, p2p: 30334 };

  aliceNode = await LocalProtocolSubstrate.start({
    name: 'substrate-alice',
    authority: 'alice',
    usageMode,
    ports: aliceManualPorts,
    isManual: true
  });

  bobNode = await LocalProtocolSubstrate.start({
    name: 'substrate-bob',
    authority: 'bob',
    usageMode,
    ports: bobManualPorts,
    isManual: true
  });
  // If LOCAL_NODE is set the tests will continue  to use the already running node
  apiPromise = await aliceNode.api();

  return apiPromise;
}

export async function stopNodes() {
  await aliceNode?.stop();
  await bobNode?.stop();
}
