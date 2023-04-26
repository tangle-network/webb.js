import { Wallet } from 'ethers';

export type CamelToKebabCase<S extends string> =
  S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T>
      ? '-'
      : ''}${Lowercase<T>}${CamelToKebabCase<U>}`
    : S;

export type ConvertToKebabCase<T> = {
  [P in keyof T as Lowercase<CamelToKebabCase<string & P>>]: T[P];
};

export type ExportedConfigOptions<VBridge> = {
  chainId: number;
  underlyingChainId: number;
  endpoint: string;
  wsEndpoint?: string;
  signatureVBridge?: VBridge;
  proposalSigningBackend?: ProposalSigningBackend;
  withdrawConfig?: WithdrawConfig;
  relayerWallet?: Wallet;
  linkedAnchors?: LinkedAnchor[];
  blockConfirmations?: number;
};

export type FullChainInfo = ChainInfo & {
  httpEndpoint: string;
  wsEndpoint: string;
  privateKey: string;
  blockConfirmations: number;
};

export interface Evm {
  [key: string]: ChainInfo;
}

export interface ChainInfo {
  name: string;
  enabled: boolean;
  chainId: number;
  beneficiary?: string;
  contracts: Contract[];
  blockConfirmations: number;
}

export interface Contract {
  contract: ContractKind;
  address: string;
  deployedAt: number;
  eventsWatcher: EventsWatcher;
  size?: number;
  withdrawConfig?: WithdrawConfig;
  proposalSigningBackend?: ProposalSigningBackend;
  linkedAnchors?: LinkedAnchor[];
}

export interface EventsWatcher {
  enabled: boolean;
  pollingInterval: number;
  printProgressInterval?: number;
}

export type RawResourceId = {
  type: 'Raw';
  resourceId: string;
};

export type EvmLinkedAnchor = {
  type: 'Evm';
  chainId: string;
  address: string;
};

export type SubstrateLinkedAnchor = {
  type: 'Substrate';
  chainId: number;
  pallet: number;
  treeId: number;
};

export type LinkedAnchor =
    | RawResourceId
    | EvmLinkedAnchor
    | SubstrateLinkedAnchor;

export interface EnabledContracts {
  contract: ContractKind;
}

export interface FeaturesConfig {
  dataQuery?: boolean;
  governanceRelay?: boolean;
  privateTxRelay?: boolean;
}

export interface WithdrawConfig {
  withdrawFeePercentage: number;
  withdrawGaslimit: `0x${string}`;
}

export type DKGProposalSigningBackend = {
  type: 'DKGNode';
  node: string;
}; /** DKG Node name in the config */

export type MockedProposalSigningBackend = {
  type: 'Mocked';
  privateKey: string;
}; /** Signer private key */

export type ProposalSigningBackend =
    | DKGProposalSigningBackend
    | MockedProposalSigningBackend;

// Default WithdrawlConfig for the contracts.
export const defaultWithdrawConfigValue: WithdrawConfig = {
  withdrawFeePercentage: 0,
  withdrawGaslimit: '0x5B8D80'
};

export type ContractKind =
    | 'SignatureBridge'
    | 'VAnchor'
    | 'OpenVAnchor';

export type RuntimeKind = 'DKG' | 'WebbProtocol';
