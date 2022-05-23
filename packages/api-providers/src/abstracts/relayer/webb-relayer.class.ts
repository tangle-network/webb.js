// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { getAnchorAddressForBridge } from '@webb-tools/api-providers/index.js';
import { LoggerService } from '@webb-tools/app-util/index.js';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { InternalChainId } from '../../chains/index.js';
import { webbCurrencyIdFromString } from '../../enums/index.js';
import { AppConfig } from '../common.js';
import { Capabilities, EVMCMDKeys, RelayedChainConfig, RelayerCMDBase, RelayerCMDKey, RelayerConfig, RelayerEVMCommands, RelayerMessage, RelayerSubstrateCommands, SubstrateCMDKeys } from './types.js';

const logger = LoggerService.get('webb-relayer class');

const shuffleRelayers = (arr: WebbRelayer[]): WebbRelayer[] => {
  let currentIndex = arr.length;
  let randomIndex = 0;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }

  return arr;
};

type MixerQuery = {
  amount: number;
  tokenSymbol: string;
};
/**
 * Relayer query object all the values are optional
 *
 * @param baseOn - Whither relayer supports evm or substrate.
 * @param ipService - Whither relayer supports the IP service
 * @param chainId - Relayer supportedChains has a chainId
 * @param contractAddress - Relayer supports the contract address
 * @param tornadoSupport - Relayer has support for  a contract with the amount and symbol `MixerQuery`
 * @param bridgeSupport - Relayer has support a contract with the amount and symbol `MixerQuery`
 **/
type RelayerQuery = {
  baseOn?: 'evm' | 'substrate';
  ipService?: true;
  chainId?: InternalChainId;
  contractAddress?: string;
  bridgeSupport?: MixerQuery;
};

export type RelayedChainInput = {
  endpoint: string;
  name: string;
  baseOn: RelayerCMDBase;
  // TODO: change to just contract
  contractAddress: string;
};

export type BridgeRelayerWithdrawArgs = {
  roots: number[];
  refreshCommitment: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: string;
  refund: string;
};
export type ContractBase = 'anchor';
type CMDSwitcher<T extends RelayerCMDBase> = T extends 'evm' ? EVMCMDKeys : SubstrateCMDKeys;

export type RelayerCMDs<A extends RelayerCMDBase, C extends CMDSwitcher<A>> = A extends 'evm'
  ? C extends keyof RelayerEVMCommands
    ? RelayerEVMCommands[C]
    : never
  : C extends keyof RelayerSubstrateCommands
    ? RelayerSubstrateCommands[C]
    : never;

export type WithdrawRelayerArgs<A extends RelayerCMDBase, C extends CMDSwitcher<A>> = Omit<
RelayerCMDs<A, C>,
keyof RelayedChainInput | 'proof'
>;

export interface RelayerInfo {
  substrate: Record<string, RelayedChainConfig | null>;
  evm: Record<string, RelayedChainConfig | null>;
}

export type ChainNameIntoChainId = (name: string, basedOn: 'evm' | 'substrate') => InternalChainId | null;

/**
 * Webb relayers manager
 * this will fetch/mange/provide this relayers and there capabilities
 *
 * @param capabilities - storage for relayers capabilities
 * @param relayerConfigs - The whole relayers configuration of the project
 * @param chainNameAdapter - An adapter for getting the  InternalChainId of the chain name and the base
 * @param appConfig - App config is used for looking up configuration values for issuing queries on the relayers
 **/
export class WebbRelayerBuilder {
  private capabilities: Record<RelayerConfig['endpoint'], Capabilities> = {};
  private _listUpdated = new Subject<void>();
  public readonly listUpdated: Observable<void>;

  private constructor (
    protected relayerConfigs: RelayerConfig[],
    private readonly chainNameAdapter: ChainNameIntoChainId,
    private appConfig: AppConfig
  ) {
    this.listUpdated = this._listUpdated.asObservable();
  }

  /**
   * Mapping the fetched relayers info to the Capabilities store
   **/
  private static infoIntoCapabilities (
    _nfig: RelayerConfig,
    info: RelayerInfo,
    nameAdapter: ChainNameIntoChainId
  ): Capabilities {
    console.log('received info: ', info);

    return {
      hasIpService: true,
      supportedChains: {
        evm: info.evm
          ? Object.keys(info.evm)
            .filter((key) => info.evm[key]?.beneficiary && nameAdapter(key, 'evm') != null)
            .reduce((m, key) => {
              m.set(nameAdapter(key, 'evm'), info.evm[key]);

              return m;
            }, new Map())
          : new Map(),
        substrate: info.substrate
          ? Object.keys(info.substrate)
            .filter((key) => info.substrate[key]?.beneficiary && nameAdapter(key, 'substrate') != null)
            .reduce((m, key) => {
              m.set(nameAdapter(key, 'substrate'), info.substrate[key]);

              return m;
            }, new Map())
          : new Map()
      }
    };
  }

  /// fetch relayers
  private async fetchCapabilitiesAndInsert (config: RelayerConfig) {
    this.capabilities[config.endpoint] = await this.fetchCapabilities(config.endpoint);

    return this.capabilities;
  }

  public async fetchCapabilities (endpoint: string): Promise<Capabilities> {
    const res = await fetch(`${endpoint}/api/v1/info`);
    const info: RelayerInfo = await res.json();

    return WebbRelayerBuilder.infoIntoCapabilities(
      {
        endpoint
      },
      info,
      this.chainNameAdapter
    );
  }

  public async addRelayer (endpoint: string) {
    const c = await this.fetchCapabilitiesAndInsert({ endpoint });

    this._listUpdated.next();

    return c;
  }

  /**
   * init the builder
   *  create new instance and fetch the relayers
   **/
  static async initBuilder (
    config: RelayerConfig[],
    chainNameAdapter: ChainNameIntoChainId,
    appConfig: AppConfig
  ): Promise<WebbRelayerBuilder> {
    const relayerBuilder = new WebbRelayerBuilder(config, chainNameAdapter, appConfig);

    // For all relayers in the relayerConfigs, fetch the info - but timeout after 5 seconds
    // This is done to prevent issues with relayers which are not operating properly
    await Promise.allSettled(
      config.map((p) => {
        return Promise.race([
          relayerBuilder.fetchCapabilitiesAndInsert(p),
          new Promise((resolve) => {
            setTimeout(resolve.bind(null, null), 5000);
          })
        ]);
      })
    );

    return relayerBuilder;
  }

  /*
   *  get a list of the suitable relayers for a given query
   *  the list is randomized
   *  Accepts a 'RelayerQuery' object with optional, indexible fields.
   **/
  getRelayer (query: RelayerQuery): WebbRelayer[] {
    const { baseOn, bridgeSupport, chainId, contractAddress, ipService } = query;
    const relayers = Object.keys(this.capabilities)
      .filter((key) => {
        const capabilities = this.capabilities[key];

        console.log('capabilities: ', capabilities);

        if (ipService) {
          if (!capabilities.hasIpService) {
            return false;
          }
        }

        if (contractAddress && baseOn && chainId) {
          if (baseOn === 'evm') {
            return Boolean(
              capabilities.supportedChains[baseOn]
                .get(chainId)
                ?.contracts?.find(
                  (contract) => contract.address === contractAddress.toLowerCase() && contract.eventsWatcher.enabled
                )
            );
          }
        }

        if (bridgeSupport && baseOn && chainId) {
          if (baseOn === 'evm') {
            const anchorAddress = getAnchorAddressForBridge(
              webbCurrencyIdFromString(bridgeSupport.tokenSymbol),
              chainId,
              bridgeSupport.amount,
              this.appConfig.bridgeByAsset
            );

            console.log('anchorAddress: ', anchorAddress);

            if (anchorAddress) {
              return Boolean(
                capabilities.supportedChains[baseOn]
                  .get(chainId)
                  ?.contracts?.find((contract) => contract.address === anchorAddress.toLowerCase())
              );
            } else {
              return false;
            }
          }
        }

        if (baseOn && chainId) {
          return Boolean(capabilities.supportedChains[baseOn].get(chainId));
        }

        if (baseOn && !chainId) {
          console.log(capabilities.supportedChains, baseOn);

          return capabilities.supportedChains[baseOn].size > 0;
        }

        return true;
      })
      .map((key) => {
        return new WebbRelayer(key, this.capabilities[key]);
      });

    shuffleRelayers(relayers);

    return relayers;
  }
}

/**
 * Relayer withdraw status
 *
 * @param PreFlight - the withdraw hasnt yet started
 * @param OnFlight - the withdraw has been submitted to the relayers and no response yet
 * @param Continue - the withdraw is being processed
 * @param CleanExit - the withdraw is done with success
 * @param Errored - failed to create the withdraw
 **/
export enum RelayedWithdrawResult {
  PreFlight,
  OnFlight,
  Continue,
  CleanExit,
  Errored,
}

/**
 * Fetching leaves from the relayer is faster than querying a chain's node.
 * The relayer will return it's state for the given merkle tree - all of the leaves up to the latest synced block value.
 *
 * @param leaves - Array of hex representation of the leaves
 * @param lastQueriedBlock - Block number at which that last update of the leaves occurred in the relayer side
 **/
type RelayerLeaves = {
  leaves: string[];
  lastQueriedBlock: number;
};

/**
 * Relayed withdraw is integrating with a relayer for doing the Withdrawal transaction without the user/owner of the commitment
 * have ot do it directly for more privacy, it's connected to the relayer via WebSocket, a new instance is instantiated for every transaction relaying
 * @param status - Status for the relayed Withdraw initially it's `PreFlight`
 * @param wacher - watch for the current withdraw status [Status, Error or transaction hash]
 * @param prefix - Prefix is used in the Record as a key for indicating the command that the relayer will parse
 * ```typescript
 * // anchorRelayTx is a prefix
 * const relayerAnchorPayload  = {
 *  emv:{
 *   anchorRelayTx:{
 *       ...
 *     }
 *    }
 * }
 * ```
 *
 **/
class RelayedWithdraw {
  private status: RelayedWithdrawResult = RelayedWithdrawResult.PreFlight;
  readonly watcher: Observable<[RelayedWithdrawResult, string | undefined]>;
  private emitter: Subject<[RelayedWithdrawResult, string | undefined]> = new Subject();

  constructor (private ws: WebSocket, private prefix: RelayerCMDKey) {
    this.watcher = this.emitter.asObservable();

    ws.onmessage = ({ data }) => {
      const handledMessage = this.handleMessage(JSON.parse(data));

      this.status = handledMessage[0];
      this.emitter.next(handledMessage);

      if (this.status === RelayedWithdrawResult.CleanExit) {
        this.emitter.complete();
        this.ws.close();
      }
    };

    ws.onerror = (e) => {
      console.log(e);
    };
  }

  private handleMessage = (data: RelayerMessage): [RelayedWithdrawResult, string | undefined] => {
    if (data.error || data.withdraw?.errored) {
      return [RelayedWithdrawResult.Errored, data.error || data.withdraw?.errored?.reason];
    } else if (data.network === 'invalidRelayerAddress') {
      return [RelayedWithdrawResult.Errored, 'Invalid relayer address'];
    } else if (data.withdraw?.finalized) {
      return [RelayedWithdrawResult.CleanExit, data.withdraw.finalized.txHash];
    } else {
      return [RelayedWithdrawResult.Continue, undefined];
    }
  };

  generateWithdrawRequest<T extends RelayedChainInput, C extends CMDSwitcher<T['baseOn']>> (
    chain: T,
    proof: RelayerCMDs<T['baseOn'], C>['proof'],
    args: WithdrawRelayerArgs<T['baseOn'], C>
  ) {
    return {
      [chain.baseOn]: {
        [this.prefix]: {
          contract: chain.contractAddress,
          proof,
          ...args
        }
      }
    };
  }

  send (withdrawRequest: any) {
    if (this.status !== RelayedWithdrawResult.PreFlight) {
      throw Error('there is a withdraw process running');
    }

    this.status = RelayedWithdrawResult.OnFlight;
    this.ws.send(JSON.stringify(withdrawRequest));
  }

  await () {
    return this.watcher
      .pipe(
        filter(([next]) => {
          return next === RelayedWithdrawResult.CleanExit || next === RelayedWithdrawResult.Errored;
        })
      )
      .toPromise();
  }

  get currentStatus () {
    return this.status;
  }
}

export class WebbRelayer {
  constructor (readonly endpoint: string, readonly capabilities: Capabilities) {}

  async initWithdraw<Target extends RelayerCMDKey> (target: Target) {
    const ws = new WebSocket(this.endpoint.replace('http', 'ws') + '/ws');

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    /// insure the socket is open
    /// maybe removed soon
    for (;;) {
      if (ws.readyState === 1) {
        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    }

    return new RelayedWithdraw(ws, target);
  }

  async getIp (): Promise<string> {
    const req = await fetch(`${this.endpoint}/api/v1/ip`);

    if (req.ok) {
      return req.json();
    } else {
      throw new Error('network error');
    }
  }

  // chainId should be formatted as a hex string
  async getLeaves (chainId: string, contractAddress: string): Promise<RelayerLeaves> {
    const url = `${this.endpoint}/api/v1/leaves/${chainId}/${contractAddress}`;

    logger.info(`fetching info from: ${url}`);
    const req = await fetch(url);

    if (req.ok) {
      const jsonResponse = await req.json();
      const fetchedLeaves: string[] = jsonResponse.leaves;
      const lastQueriedBlock: string = jsonResponse.lastQueriedBlock;
      const lastQueriedBlockNumber: number = parseInt(lastQueriedBlock, 16);

      logger.info(`info fetched from relayer: ${fetchedLeaves} + ${lastQueriedBlockNumber}`);

      return {
        lastQueriedBlock: lastQueriedBlockNumber,
        leaves: fetchedLeaves
      };
    } else {
      throw new Error('network error');
    }
  }

  static intoActiveWebRelayer (
    instance: WebbRelayer,
    query: { chain: InternalChainId; basedOn: 'evm' | 'substrate' },
    getFees: (note: string) => Promise<{ totalFees: string; withdrawFeePercentage: number } | undefined>
  ): ActiveWebbRelayer {
    return new ActiveWebbRelayer(instance.endpoint, instance.capabilities, query, getFees);
  }
}

export class ActiveWebbRelayer extends WebbRelayer {
  constructor (
    endpoint: string,
    capabilities: Capabilities,
    private query: { chain: InternalChainId; basedOn: 'evm' | 'substrate' },
    private getFees: (note: string) => Promise<{ totalFees: string; withdrawFeePercentage: number } | undefined>
  ) {
    super(endpoint, capabilities);
  }

  private get config () {
    const list = this.capabilities.supportedChains[this.query.basedOn];

    return list.get(this.query.chain);
  }

  get gasLimit (): number | undefined {
    return undefined;
  }

  get account (): string | undefined {
    return this.config?.account;
  }

  get beneficiary (): string | undefined {
    return this.config?.beneficiary;
  }

  fees = async (note: string) => {
    return this.getFees(note);
  };
}
