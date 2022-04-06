// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { InternalChainId } from '../../chains/index.js';

export type RelayedChainConfig = {
  account: string;
  beneficiary?: string;
  contracts: Contract[];
};
export type Capabilities = {
  hasIpService: boolean;
  supportedChains: {
    substrate: Map<InternalChainId, RelayedChainConfig>;
    evm: Map<InternalChainId, RelayedChainConfig>;
  };
};

export interface Contract {
  contract: string;
  address: string;
  deployedAt: number;
  eventsWatcher: EventsWatcher;
  size: number;
  withdrawFeePercentage: number;
  linkedAnchors: LinkedAnchor[];
}

export interface LinkedAnchor {
  chain: string;
  address: string;
}

export interface EventsWatcher {
  enabled: boolean;
  pollingInterval: number;
}

export type RelayerConfig = {
  endpoint: string;
};

export interface Withdraw {
  finalized?: Finalized;
  errored?: Errored;
  connected?: string;
  connecting?: string;
}

export interface Finalized {
  txHash: string;
}

export interface Errored {
  reason: string;
}

export type RelayerMessage = {
  withdraw?: Withdraw;
  error?: string;
  network?: string;
};
export type RelayerCMDBase = 'evm' | 'substrate';
export type MixerRelayTx = {
  chain: string;
  // Tree ID (Mixer tree id)
  id: number;
  proof: Array<number>;
  root: Array<number>;
  nullifierHash: Array<number>;
  // Ss558 Format
  recipient: string;
  // Ss558 Format
  relayer: string;
  fee: number;
  refund: number;
};

type AnchorRelayTransaction = {
  chain: string;
  // The target contract.
  contract: string;
  // Proof bytes
  proof: string;
  // Fixed length Hex string
  fee: string;
  nullifierHash: string;
  recipient: string;
  // Fixed length Hex string
  refund: string;
  relayer: string;
  refreshCommitment: string;
  roots: Array<number>;
};
export type RelayerSubstrateCommands = {
  mixerRelayTx: MixerRelayTx;
};
export type RelayerEVMCommands = {
  anchorRelayTx: AnchorRelayTransaction;
};
export type EVMCMDKeys = keyof RelayerEVMCommands;
export type SubstrateCMDKeys = keyof RelayerSubstrateCommands;
export type RelayerCMDKey = EVMCMDKeys | SubstrateCMDKeys;
