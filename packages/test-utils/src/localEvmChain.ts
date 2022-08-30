import { MintableToken } from '@webb-tools/tokens';
import { getChainIdType, ZkComponents } from '@webb-tools/utils';
import { VBridge, VBridgeInput } from '@webb-tools/vbridge';
import { ethers } from 'ethers';
import { Server } from 'ganache';

import { GanacheAccounts, startGanacheServer } from './startGanacheServer.js';

export class LocalEvmChain {
  public readonly typedChainId: number;

  constructor (
    public readonly endpoint: string,
    public readonly evmId: number,
    private readonly server: Server<'ethereum'>
  ) {
    this.typedChainId = getChainIdType(evmId);
  }

  public static async init (
    name: string,
    evmId: number,
    initalBalances: GanacheAccounts[],
    options?: any
  ): Promise<LocalEvmChain> {
    const endpoint = `http://localhost:${evmId}`;
    const server = await startGanacheServer(evmId, evmId, initalBalances, {
      miner: {
        blockTime: 1
      },
      quiet: true,
      ...options
    });
    const chain = new LocalEvmChain(endpoint, evmId, server);

    return chain;
  }

  public provider (): ethers.providers.WebSocketProvider {
    return new ethers.providers.WebSocketProvider(this.endpoint);
  }

  public async stop () {
    await this.server.close();
  }

  public async deployToken (
    name: string,
    symbol: string,
    wallet: ethers.Signer
  ): Promise<MintableToken> {
    return MintableToken.createToken(name, symbol, wallet);
  }

  // It is expected that parameters are passed with the same indices of arrays.
  public static async deployVBridge (
    chains: LocalEvmChain[],
    tokens: MintableToken[],
    wallets: ethers.Wallet[],
    zkComponentsSmall: ZkComponents,
    zkComponentsLarge: ZkComponents
  ): Promise<VBridge> {
    const assetRecord: Record<number, string[]> = {};
    const deployers: Record<number, ethers.Wallet> = {};
    const governors: Record<number, string> = {};
    const chainIdsArray: number[] = [];

    for (let i = 0; i < chains.length; i++) {
      wallets[i].connect(chains[i].provider());
      assetRecord[chains[i].typedChainId] = [tokens[i].contract.address];
      deployers[chains[i].typedChainId] = wallets[i];
      governors[chains[i].typedChainId] = await wallets[i].getAddress();
      chainIdsArray.push(chains[i].typedChainId);
    }

    const bridgeInput: VBridgeInput = {
      chainIDs: chainIdsArray,
      vAnchorInputs: {
        asset: assetRecord
      },
      webbTokens: new Map()
    };
    const deployerConfig = {
      ...deployers
    };
    const governorConfig = {
      ...governors
    };

    return VBridge.deployVariableAnchorBridge(
      bridgeInput,
      deployerConfig,
      governorConfig,
      zkComponentsSmall,
      zkComponentsLarge
    );
  }
}
