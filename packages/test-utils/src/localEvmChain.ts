import { IVariableAnchorExtData, IVariableAnchorPublicInputs } from '@webb-tools/interfaces';
import { Anchors } from '@webb-tools/protocol-solidity';
import { CircomUtxo, Keypair, Utxo } from '@webb-tools/sdk-core';
import { LocalChain } from '@webb-tools/test-utils/localTestnet';
import { MintableToken } from '@webb-tools/tokens';
import { getChainIdType, ZkComponents } from '@webb-tools/utils';
import { VBridge, VBridgeInput } from '@webb-tools/vbridge';
import { ethers, Wallet } from 'ethers';
import { Server } from 'ganache';

import { hexToU8a, u8aToHex } from '@polkadot/util';

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

/** Sets up vanchor transaction for the evm
    Generates extData and publicInputs to be used for vanchor transaction
 **/
export async function setupVanchorEvmTx (
  depositUtxo: Utxo,
  srcChain: LocalChain,
  destChain: LocalChain,
  randomKeypair: Keypair,
  srcVanchor: Anchors.VAnchor,
  destVanchor: Anchors.VAnchor,
  relayerWallet2: Wallet
): Promise<{
    extData: IVariableAnchorExtData;
    publicInputs: IVariableAnchorPublicInputs;
  }> {
  const extAmount = ethers.BigNumber.from(0).sub(depositUtxo.amount);

  const dummyOutput1 = await CircomUtxo.generateUtxo({
    amount: '0',
    backend: 'Circom',
    chainId: destChain.chainId.toString(),
    curve: 'Bn254',
    keypair: randomKeypair
  });

  const dummyOutput2 = await CircomUtxo.generateUtxo({
    amount: '0',
    backend: 'Circom',
    chainId: destChain.chainId.toString(),
    curve: 'Bn254',
    keypair: randomKeypair
  });

  const dummyInput = await CircomUtxo.generateUtxo({
    amount: '0',
    backend: 'Circom',
    chainId: destChain.chainId.toString(),
    curve: 'Bn254',
    keypair: randomKeypair,
    originChainId: destChain.chainId.toString()
  });

  const recipient = '0x0000000001000000000100000000010000000001';

  // Populate the leavesMap for generating the zkp against the source chain
  //
  const leaves1 = srcVanchor.tree
    .elements()
    .map((el) => hexToU8a(el.toHexString()));

  const leaves2 = destVanchor.tree
    .elements()
    .map((el) => hexToU8a(el.toHexString()));

  const depositUtxoIndex = srcVanchor.tree.getIndexByElement(
    u8aToHex(depositUtxo.commitment)
  );

  const regeneratedUtxo = await CircomUtxo.generateUtxo({
    amount: depositUtxo.amount,
    backend: 'Circom',
    blinding: hexToU8a(depositUtxo.blinding),
    chainId: depositUtxo.chainId,
    curve: 'Bn254',
    index: depositUtxoIndex.toString(),
    keypair: randomKeypair,
    originChainId: depositUtxo.originChainId,
    privateKey: hexToU8a(depositUtxo.secret_key)
  });

  const leavesMap = {
    [srcChain.chainId]: leaves1,
    [destChain.chainId]: leaves2
  };

  const { extData, publicInputs } = await destVanchor.setupTransaction(
    [regeneratedUtxo, dummyInput],
    [dummyOutput1, dummyOutput2],
    extAmount,
    0,
    0,
    relayerWallet2.address,
    recipient,
    relayerWallet2.address,
    leavesMap
  );

  return { extData, publicInputs };
}
