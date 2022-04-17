// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { AnchorApi } from '@webb-tools/api-providers/index.js';
import { LoggerService } from '@webb-tools/app-util/index.js';
import { Note, NoteGenInput } from '@webb-tools/sdk-core/index.js';

import { u8aToHex } from '@polkadot/util';

import { AnchorDeposit, AnchorSize, DepositPayload as IDepositPayload } from '../abstracts/index.js';
import { ChainType, computeChainIdType, InternalChainId, SubstrateChainId } from '../chains/index.js';
import { BridgeConfig } from '../types/bridge-config.interface.js';
import { WebbError, WebbErrorCodes } from '../webb-error/index.js';
import { WebbPolkadot } from './webb-provider.js';

const logger = LoggerService.get('PolkadotBridgeDeposit');

type DepositPayload = IDepositPayload<Note, [number, string]>;
/**
 * Webb Anchor API implementation for Polkadot
 **/
export class PolkadotBridgeDeposit extends AnchorDeposit<WebbPolkadot, DepositPayload> {
  async deposit (depositPayload: DepositPayload): Promise<void> {
    const tx = this.inner.txBuilder.build(
      {
        method: 'deposit',
        section: 'anchorBn254'
      },
      depositPayload.params
    );
    const account = await this.inner.accounts.activeOrDefault;

    if (!account) {
      throw WebbError.from(WebbErrorCodes.NoAccountAvailable);
    }

    const hash = await tx.call(account.address);

    console.log(hash);
  }

  async generateBridgeNote (
    anchorId: number | string,
    destination: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    wrappableAssetAddress: string | undefined
  ): Promise<DepositPayload> {
    // Get the currency bridge currency
    const currency = this.bridgeApi.currency;

    // No currency is selected on the API
    if (!currency) {
      logger.error('Not currency/active bridge available');
      throw new Error('api not ready');
    }

    const tokenSymbol = currency.view.symbol;
    const destChainId = destination;
    // TODO: add mappers similar to evm chain id
    // const chainId = this.inner.api.registry.chainSS58!;
    const chainId = SubstrateChainId.WebbEggnet;
    const sourceChainId = computeChainIdType(ChainType.Substrate, chainId);
    const anchorPath = String(anchorId).replace('Bridge=', '').split('@');
    const amount = anchorPath[0];
    const anchorIndex = anchorPath[2];
    const anchors = await this.bridgeApi.getAnchors();
    const anchor = anchors[Number(anchorIndex)];

    logger.trace({
      amount,
      anchor,
      anchorId,
      anchorIndex,
      anchors,
      destination,
      sourceChainId
    });
    const treeId = anchor.neighbours[InternalChainId.WebbDevelopment] as number; // TODO: Anchor in one chain the 0 id contains the treeId
    // Create the note gen input
    const noteInput: NoteGenInput = {
      amount: amount,
      backend: 'Arkworks',
      curve: 'Bn254',
      denomination: '18',
      exponentiation: '5',
      hashFunction: 'Poseidon',
      protocol: 'anchor',
      sourceChain: sourceChainId.toString(),
      sourceIdentifyingData: anchorIndex.toString(),
      targetChain: destChainId.toString(),
      targetIdentifyingData: treeId.toString(),
      tokenSymbol: tokenSymbol,
      version: 'v1',
      width: '4'
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

  private get bridgeApi () {
    return this.inner.methods.anchorApi as AnchorApi<WebbPolkadot, BridgeConfig>;
  }

  async getSizes (): Promise<AnchorSize[]> {
    const anchors = await this.bridgeApi.getAnchors();
    const currency = this.bridgeApi.currency;

    if (currency) {
      return anchors.map((anchor, anchorIndex) => ({
        amount: Number(anchor.amount),
        asset: currency.view.symbol,
        id: `Bridge=${anchor.amount}@${currency.view.name}@${anchorIndex}`,
        title: `${anchor.amount} ${currency.view.name}`
      }));
    }

    return [];
  }
}
