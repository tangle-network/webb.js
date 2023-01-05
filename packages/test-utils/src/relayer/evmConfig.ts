import fs from 'fs';
import {
  Contract,
  ConvertToKebabCase,
  EventsWatcher,
  FullChainInfo,
  LinkedAnchor,
  ProposalSigningBackend,
  WithdrawConfig
} from './config';

export async function writeConfig(
  path: string,
  config: FullChainInfo,
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
    name: config.name,
    enabled: config.enabled,
    'http-endpoint': config.httpEndpoint,
    'ws-endpoint': config.wsEndpoint,
    'chain-id': config.chainId,
    'block-confirmations': config.blockConfirmations,
    beneficiary: config.beneficiary,
    'private-key': config.privateKey,
    contracts: config.contracts.map((contract) => ({
      contract: contract.contract,
      address: contract.address,
      'deployed-at': contract.deployedAt,
      'proposal-signing-backend':
        contract.proposalSigningBackend?.type === 'Mocked'
          ? {
            type: 'Mocked',
            'private-key': contract.proposalSigningBackend?.privateKey,
          }
          : contract.proposalSigningBackend?.type === 'DKGNode'
            ? {
              type: 'DKGNode',
              node: contract.proposalSigningBackend?.node,
            }
            : undefined,
      'withdraw-config': contract.withdrawConfig
        ? {
          'withdraw-fee-percentage':
            contract.withdrawConfig?.withdrawFeePercentage,
          'withdraw-gaslimit': contract.withdrawConfig?.withdrawGaslimit,
        }
        : undefined,
      'events-watcher': {
        enabled: contract.eventsWatcher.enabled,
        'polling-interval': contract.eventsWatcher.pollingInterval,
        'print-progress-interval':
          contract.eventsWatcher.printProgressInterval,
      },
      'linked-anchors': contract?.linkedAnchors?.map((anchor: LinkedAnchor) =>
        anchor.type === 'Evm'
          ? {
            'chain-id': anchor.chainId,
            type: 'Evm',
            address: anchor.address,
          }
          : anchor.type === 'Substrate'
            ? {
              type: 'Substrate',
              'chain-id': anchor.chainId,
              'tree-id': anchor.treeId,
              pallet: anchor.pallet,
            }
            : {
              type: 'Raw',
              'resource-id': anchor.resourceId,
            }
      ),
    })),
  };
  const fullConfigFile: FullConfigFile = {
    evm: {
      [config.chainId]: convertedConfig,
    },
  };
  const configString = JSON.stringify(fullConfigFile, null, 2);
  fs.writeFileSync(path, configString);
}