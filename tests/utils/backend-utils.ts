import {LocalProtocolSubstrate, UsageMode} from "@webb-tools/test-utils";
import isCi from "is-ci";
import path from "path";

const usageMode: UsageMode = isCi
  ? { mode: 'docker', forcePullImage: false }
  : {
    mode: 'host',
    nodePath: path.resolve(
      '../protocol-substrate/target/release/webb-standalone-node'
    ),
  };

export async function startProtocolSubstrateNodes(): Promise<LocalProtocolSubstrate[]> {
  const aliceManualPorts = { ws: 9944, http: 9933, p2p: 30333 };
  const bobManualPorts = { ws: 9945, http: 9934, p2p: 30334 };
  let aliceNode = await LocalProtocolSubstrate.start({
    name: 'substrate-alice',
    authority: 'alice',
    usageMode,
    ports: aliceManualPorts,
    isManual: true
  });

  let bobNode = await LocalProtocolSubstrate.start({
    name: 'substrate-bob',
    authority: 'bob',
    usageMode,
    ports: bobManualPorts,
    isManual: true
  });

  return [aliceNode, bobNode];
}
