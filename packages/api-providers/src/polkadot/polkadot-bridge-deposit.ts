import { u8aToHex } from '@polkadot/util';
import { LoggerService } from '@webb-tools/app-util';
import { BridgeDeposit } from '../bridge';
import { WebbError, WebbErrorCodes } from '../webb-error';
import { WebbPolkadot } from './webb-polkadot-provider';
import { ChainType, computeChainIdType, InternalChainId, SubstrateChainId } from '../chains';
import { Note, NoteGenInput } from '@webb-tools/sdk-core';
import { BridgeApi } from '../bridge/bridge-api';
import { BridgeConfig } from '../types/bridge-config.interface';
import { DepositPayload as IDepositPayload, MixerSize } from '../webb-context';
const logger = LoggerService.get('PolkadotBridgeDeposit');

type DepositPayload = IDepositPayload<Note, [number, string]>;

export class PolkadotBridgeDeposit extends BridgeDeposit<WebbPolkadot, DepositPayload> {
  async deposit(depositPayload: DepositPayload): Promise<void> {
    const tx = this.inner.txBuilder.build(
      {
        section: 'anchorBn254',
        method: 'deposit'
      },
      depositPayload.params
    );
    const account = await this.inner.accounts.activeOrDefault;
    if (!account) {
      throw WebbError.from(WebbErrorCodes.NoAccountAvailable);
    }
    const hash = await tx.call(account.address);
    console.log(hash);
    return;
  }

  async generateBridgeNote(
    mixerId: number | string,
    destination: number,
    wrappableAssetAddress: string | undefined
  ): Promise<DepositPayload> {
    const currency = this.bridgeApi.currency;

    if (!currency) {
      logger.error('Not currency/active bridge available');
      throw new Error('api not ready');
    }
    const tokenSymbol = currency.view.symbol;
    const destChainId = destination;
    // TODO: add mappers similar to evm chain id
    // const chainId = this.inner.api.registry.chainSS58!;
    const chainId = SubstrateChainId.Webb;
    const sourceChainId = computeChainIdType(ChainType.Substrate, chainId);
    const anchorPath = String(mixerId).replace('Bridge=', '').split('@');
    const amount = anchorPath[0];
    const anchorIndex = anchorPath[2];
    const anchors = await this.bridgeApi.getAnchors();
    const anchor = anchors[Number(anchorIndex)];
    logger.trace({
      amount,
      anchorIndex,
      anchor,
      anchors,
      sourceChainId,
      destination,
      mixerId
    });
    const treeId = anchor.neighbours[InternalChainId.WebbDevelopment] as number; // TODO: Anchor in one chain the 0 id contains the treeId
    const noteInput: NoteGenInput = {
      exponentiation: '5',
      width: '4',
      protocol: 'anchor',
      chain: destChainId.toString(),
      sourceChain: sourceChainId.toString(),
      sourceIdentifyingData: anchorIndex.toString(),
      targetIdentifyingData: treeId.toString(),
      amount: amount,
      denomination: '18',
      hashFunction: 'Poseidon',
      curve: 'Bn254',
      backend: 'Arkworks',
      version: 'v1',
      tokenSymbol: tokenSymbol
    };
    logger.log('note input', noteInput);
    const note = await Note.generateNote(noteInput);
    logger.log('Generated note: ', note.note);
    const leaf = note.getLeaf();
    const leafHex = u8aToHex(leaf);
    logger.trace(`treeId ${treeId}, Leaf ${leafHex}`);
    return {
      note,
      params: [treeId, leafHex]
    };
  }

  private get bridgeApi() {
    return this.inner.methods.bridgeApi as BridgeApi<WebbPolkadot, BridgeConfig>;
  }

  async getSizes(): Promise<MixerSize[]> {
    const anchors = await this.bridgeApi.getAnchors();
    const currency = this.bridgeApi.currency;
    if (currency) {
      return anchors.map((anchor, anchorIndex) => ({
        id: `Bridge=${anchor.amount}@${currency.view.name}@${anchorIndex}`,
        title: `${anchor.amount} ${currency.view.name}`
      }));
    }
    return [];
  }
}
