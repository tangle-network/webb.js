// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { AppConfig, MixerSize, NotificationHandler, Web3AnchorDeposit, WebbApiProvider, WebbMethods, WebbProviderEvents, WebbRelayerBuilder } from '@webb-tools/api-providers';
import { EventBus } from '@webb-tools/app-util';
import { Note } from '@webb-tools/sdk-core';
import { providers } from 'ethers';
import { Eth } from 'web3-eth';

import { AccountsAdapter } from '../account/Accounts.adapter';
import { EVMChainId, evmIdIntoInternalChainId, parseChainIdType } from '../chains';
import { AnchorContract, TornadoContract } from '../contracts/contracts';
import { Web3Accounts, Web3Provider } from '../ext-providers';
import { WebbError, WebbErrorCodes } from '../webb-error';
import { Web3AnchorApi } from './anchor-api';
import { Web3AnchorWithdraw } from './anchor-withdraw';
import { Web3ChainQuery } from './chain-query';
import { EvmChainMixersInfo } from './EvmChainMixersInfo';
import { Web3MixerDeposit } from './mixer-deposit';
import { Web3MixerWithdraw } from './mixer-withdraw';
import { Web3WrapUnwrap } from './wrap-unwrap';

export class WebbWeb3Provider
  extends EventBus<WebbProviderEvents<[number]>>
  implements WebbApiProvider<WebbWeb3Provider> {
  readonly methods: WebbMethods<WebbWeb3Provider>;
  private ethersProvider: providers.Web3Provider;
  private connectedMixers: EvmChainMixersInfo;
  // TODO: make the factory configurable if the web3 interface in need of this functionality
  readonly wasmFactory = () => {
    return null;
  };

  private constructor (
    private web3Provider: Web3Provider,
    protected chainId: number,
    readonly relayingManager: WebbRelayerBuilder,
    readonly config: AppConfig,
    readonly notificationHandler: NotificationHandler,
    readonly accounts: AccountsAdapter<Eth>
  ) {
    super();
    this.ethersProvider = web3Provider.intoEthersProvider();

    // TODO: fix types
    // Remove listeners for chainChanged on the previous object
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.ethersProvider.provider?.removeAllListeners('chainChanged');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.ethersProvider.provider?.on?.('accountsChanged', () => {
      this.emit('newAccounts', this.accounts);
    });
    this.connectedMixers = new EvmChainMixersInfo(this.config, chainId);
    this.methods = {
      anchor: {
        core: null,
        deposit: {
          enabled: true,
          inner: new Web3AnchorDeposit(this)
        },
        withdraw: {
          enabled: true,
          inner: new Web3AnchorWithdraw(this)
        }
      },
      anchorApi: new Web3AnchorApi(this, this.config.bridgeByAsset),
      chainQuery: new Web3ChainQuery(this),
      mixer: {
        deposit: {
          enabled: true,
          inner: new Web3MixerDeposit(this)
        },
        withdraw: {
          enabled: true,
          inner: new Web3MixerWithdraw(this)
        }
      },
      wrapUnwrap: {
        core: {
          enabled: true,
          inner: new Web3WrapUnwrap(this)
        }
      }
    };
  }

  getProvider (): Web3Provider {
    return this.web3Provider;
  }

  async setChainListener () {
    this.ethersProvider = this.web3Provider.intoEthersProvider();

    const handler = async () => {
      const chainId = await this.web3Provider.network;

      this.emit('providerUpdate', [chainId]);
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.ethersProvider.provider?.on?.('chainChanged', handler);
  }

  setStorage (chainId: number) {
    this.connectedMixers = new EvmChainMixersInfo(this.config, chainId);
  }

  async destroy (): Promise<void> {
    await this.endSession();
    this.subscriptions = {
      interactiveFeedback: [],
      providerUpdate: []
    };
  }

  async getChainId (): Promise<number> {
    const chainId = (await this.ethersProvider.getNetwork()).chainId;

    return chainId;
  }

  getMixers () {
    return this.connectedMixers;
  }

  getTornadoContractAddressByNote (note: Note) {
    const evmId = parseChainIdType(Number(note.note.targetChainId)).chainId as EVMChainId;
    const availableMixers = new EvmChainMixersInfo(this.config, evmId);
    const mixer = availableMixers.getTornMixerInfoBySize(Number(note.note.amount), note.note.tokenSymbol);

    if (!mixer) {
      throw new Error('Mixer not found');
    }

    return mixer.address;
  }

  async getContractByAddress (mixerAddress: string): Promise<TornadoContract> {
    return new TornadoContract(this.connectedMixers, this.ethersProvider, mixerAddress);
  }

  getWebbAnchorByAddress (address: string): AnchorContract {
    return new AnchorContract(this.connectedMixers, this.ethersProvider, address);
  }

  getWebbAnchorByAddressAndProvider (address: string, provider: providers.Web3Provider): AnchorContract {
    return new AnchorContract(this.connectedMixers, provider, address, true);
  }

  getMixerInfoBySize (mixerSize: number, tokenSymbol: string) {
    const mixer = this.connectedMixers.getTornMixerInfoBySize(mixerSize, tokenSymbol);

    if (!mixer) {
      throw WebbError.from(WebbErrorCodes.MixerSizeNotFound);
    }

    return mixer;
  }

  // This function limits the mixer implementation to one type for the token/size pair.
  // Something like a poseidon hasher implementation instead of mimc hasher cannot
  // exist alongside each other.
  async getContractBySize (mixerSize: number, tokenSymbol: string): Promise<TornadoContract> {
    const mixer = this.connectedMixers.getTornMixerInfoBySize(mixerSize, tokenSymbol);

    if (!mixer) {
      throw WebbError.from(WebbErrorCodes.MixerSizeNotFound);
    }

    return new TornadoContract(this.connectedMixers, this.ethersProvider, mixer.address);
  }

  getEthersProvider (): providers.Web3Provider {
    return this.ethersProvider;
  }

  getMixerSizes (tokenSymbol: string): Promise<MixerSize[]> {
    return Promise.resolve(this.connectedMixers.getTornMixerSizes(tokenSymbol));
  }

  // Init web3 provider with the `Web3Accounts` as the default account provider
  static async init (
    web3Provider: Web3Provider,
    chainId: number,
    relayerBuilder: WebbRelayerBuilder,
    appConfig: AppConfig,
    notification: NotificationHandler
  ) {
    const accounts = new Web3Accounts(web3Provider.eth);

    return new WebbWeb3Provider(web3Provider, chainId, relayerBuilder, appConfig, notification, accounts);
  }

  // Init web3 provider with a generic account provider
  static async initWithCustomAccountAdapter (
    web3Provider: Web3Provider,
    chainId: number,
    relayerBuilder: WebbRelayerBuilder,
    appConfig: AppConfig,
    notification: NotificationHandler,
    web3AccountProvider: AccountsAdapter<Eth>
  ) {
    return new WebbWeb3Provider(web3Provider, chainId, relayerBuilder, appConfig, notification, web3AccountProvider);
  }

  get capabilities () {
    return this.web3Provider.capabilities;
  }

  endSession (): Promise<void> {
    return this.web3Provider.endSession();
  }

  switchOrAddChain (evmChainId: number) {
    return this.web3Provider
      .switchChain({
        chainId: `0x${evmChainId.toString(16)}`
      })
      ?.catch(async (switchError) => {
        console.log('inside catch for switchChain', switchError);

        // cannot switch because network not recognized, so fetch configuration
        const chainId = evmIdIntoInternalChainId(evmChainId);
        const chain = this.config.chains[chainId];

        // prompt to add the chain
        if (switchError.code === 4902) {
          const currency = this.config.currencies[chain.nativeCurrencyId];

          await this.web3Provider.addChain({
            chainId: `0x${evmChainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: {
              decimals: 18,
              name: currency.name,
              symbol: currency.symbol
            },
            rpcUrls: chain.evmRpcUrls!
          });
          // add network will prompt the switch, check evmId again and throw if user rejected
          const newChainId = await this.web3Provider.network;

          if (newChainId !== chain.chainId) {
            throw switchError;
          }
        } else {
          throw switchError;
        }
      });
  }

  public get innerProvider () {
    return this.web3Provider;
  }
}
