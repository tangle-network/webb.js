import {LocalProtocolSubstrate, UsageMode} from "@webb-tools/test-utils";
import isCi from "is-ci";
import path from "path";
import {ApiPromise} from "@polkadot/api";

const usageMode: UsageMode = isCi
  ? { mode: 'docker', forcePullImage: false }
  : {
    mode: 'host',
    nodePath: path.resolve(
      '../../protocol-substrate/target/release/webb-standalone-node'
    ),
  };

let aliceNode: LocalProtocolSubstrate;
// @ts-ignore
let bobNode: LocalProtocolSubstrate;

let apiPromise: ApiPromise | null = null;

export async function startWebbNode(): Promise<ApiPromise>  {
  aliceNode = await LocalProtocolSubstrate.start({
    name: 'substrate-alice',
    authority: 'alice',
    usageMode,
    ports: 'auto'
  });

  bobNode = await LocalProtocolSubstrate.start({
    name: 'substrate-bob',
    authority: 'bob',
    usageMode,
    ports: 'auto'
  });
  // If LOCAL_NODE is set the tests will continue  to use the already running node
  apiPromise = await aliceNode.api();

  return apiPromise;
}

export async function stopNodes() {
  await aliceNode?.stop();
  await bobNode?.stop();
}
