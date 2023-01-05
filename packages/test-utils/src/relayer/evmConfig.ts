import fs from 'fs';

import { Contract, ConvertToKebabCase, EventsWatcher, FullChainInfo, LinkedAnchor, ProposalSigningBackend, WithdrawConfig } from './config';

export async function writeConfig (
  path: string,
  config: FullChainInfo
): Promise<void> {
  type ConvertedLinkedAnchor = ConvertToKebabCase<LinkedAnchor>;
  type ConvertedContract = Omit<
  ConvertToKebabCase<Contract>,
  | 'events-watcher'
  | 'proposal-signing-backend'
  | 'withdraw-config'
  | 'linked-anchors'
  > & {
    'events-watcher': ConvertToKebabCase<EventsWatcher>;
    'proposal-signing-backend'?: ConvertToKebabCase<ProposalSigningBackend>;
    'withdraw-config'?: ConvertToKebabCase<WithdrawConfig>;
    'linked-anchors'?: ConvertedLinkedAnchor[];
  };
  type ConvertedConfig = Omit<
  ConvertToKebabCase<typeof config>,
  'contracts'
  > & {
    contracts: ConvertedContract[];
  };
  type FullConfigFile = {
    evm: {
      // chainId as the chain identifier
      [key: number]: ConvertedConfig;
    };
  };

  const convertedConfig: ConvertedConfig = {
    beneficiary: config.beneficiary,
    'block-confirmations': config.blockConfirmations,
    'chain-id': config.chainId,
    contracts: config.contracts.map((contract) => ({
      address: contract.address,
      contract: contract.contract,
      'deployed-at': contract.deployedAt,
      'events-watcher': {
        enabled: contract.eventsWatcher.enabled,
        'polling-interval': contract.eventsWatcher.pollingInterval,
        'print-progress-interval':
          contract.eventsWatcher.printProgressInterval
      },
      'linked-anchors': contract?.linkedAnchors?.map((anchor: LinkedAnchor) =>
        anchor.type === 'Evm'
          ? {
            address: anchor.address,
            'chain-id': anchor.chainId,
            type: 'Evm'
          }
          : anchor.type === 'Substrate'
            ? {
              'chain-id': anchor.chainId,
              pallet: anchor.pallet,
              'tree-id': anchor.treeId,
              type: 'Substrate'

            }
            : {
              'resource-id': anchor.resourceId,
              type: 'Raw'
            }
      ),
      'proposal-signing-backend':
        contract.proposalSigningBackend?.type === 'Mocked'
          ? {
            'private-key': contract.proposalSigningBackend?.privateKey,
            type: 'Mocked'
          }
          : contract.proposalSigningBackend?.type === 'DKGNode'
            ? {
              node: contract.proposalSigningBackend?.node,
              type: 'DKGNode'
            }
            : undefined,
      'withdraw-config': contract.withdrawConfig
        ? {
          'withdraw-fee-percentage':
            contract.withdrawConfig?.withdrawFeePercentage,
          'withdraw-gaslimit': contract.withdrawConfig?.withdrawGaslimit
        }
        : undefined
    })),
    enabled: config.enabled,
    'http-endpoint': config.httpEndpoint,
    name: config.name,
    'private-key': config.privateKey,
    'ws-endpoint': config.wsEndpoint
  };
  const fullConfigFile: FullConfigFile = {
    evm: {
      [config.chainId]: convertedConfig
    }
  };
  const configString = JSON.stringify(fullConfigFile, null, 2);

  fs.writeFileSync(path, configString);
}
