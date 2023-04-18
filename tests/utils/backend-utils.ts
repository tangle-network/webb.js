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

export async function startProtocolSubstrateNodes(): Promise<[LocalProtocolSubstrate, LocalProtocolSubstrate]> {
  let aliceNode = await LocalProtocolSubstrate.start({
    name: 'substrate-alice',
    authority: 'alice',
    usageMode,
    ports: 'auto'
  });

  let bobNode = await LocalProtocolSubstrate.start({
    name: 'substrate-bob',
    authority: 'bob',
    usageMode,
    ports: 'auto'
  });

  return [aliceNode, bobNode];
}
