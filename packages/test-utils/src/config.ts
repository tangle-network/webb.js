export interface EnabledContracts {
  contract: ContractKind;
}

type ContractKind =
  | 'Anchor'
  | 'SignatureBridge'
  | 'GovernanceBravoDelegate'
  | 'VAnchor';

export interface EventsWatcher {
  enabled: boolean;
  pollingInterval: number;
  printProgressInterval?: number;
}

export interface WithdrawConfig {
  withdrawFeePercentage: number;
  withdrawGaslimit: `0x${string}`;
}

export interface LinkedAnchor {
  chain: string;
  chainId: string;
  address: string;
}

export interface Contract {
  contract: ContractKind;
  address: string;
  deployedAt: number;
  eventsWatcher: EventsWatcher;
  size?: number;
  withdrawConfig?: WithdrawConfig;
  linkedAnchors?: LinkedAnchor[];
}

export interface ChainInfo {
  name: string;
  enabled: boolean;
  chainId: number;
  beneficiary?: string;
  contracts: Contract[];
}
