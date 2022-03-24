/* eslint-disable @typescript-eslint/ban-ts-comment */
import {LoggerService} from '@webb-tools/app-util';
import {Note, NoteGenInput} from '@webb-tools/sdk-core';
import {PalletMixerMixerMetadata} from '@webb-tools/types/interfaces/pallets';

import {u8aToHex} from '@polkadot/util';

import {WebbPolkadot} from './webb-polkadot-provider';
import {DepositPayload as TDepositPayload, MixerDeposit, MixerSize} from '@webb-tools/api-providers';
import {ORMLCurrency} from '@webb-tools/api-providers';
import {WebbError, WebbErrorCodes} from '../webb-error';
import {Currency} from '@webb-tools/api-providers';
import {ChainType, computeChainIdType, internalChainIdToChainId} from '../chains';

type DepositPayload = TDepositPayload<Note, [number, string]>;
const logger = LoggerService.get('tornado-deposit');

export class PolkadotMixerDeposit extends MixerDeposit<WebbPolkadot, DepositPayload> {
  constructor(protected inner: WebbPolkadot) {
    super(inner);
  }

  static async getSizes(webbPolkadot: WebbPolkadot): Promise<MixerSize[]> {
    const api = webbPolkadot.api;
    const ormlCurrency = new ORMLCurrency(webbPolkadot);
    const ormlAssets = await ormlCurrency.list();
    const data = await api.query.mixerBn254.mixers.entries();
    // @ts-ignore
    const tokenProperty: Array<NativeTokenProperties> = await api.rpc.system.properties();
    const groupItem = data
      .map(([storageKey, info]) => {
        const mixerInfo = (info as unknown as PalletMixerMixerMetadata).toHuman();
        const cId = Number(mixerInfo.asset);
        const amount = mixerInfo.depositSize;
        // @ts-ignore
        const treeId = storageKey.toHuman()[0];
        const id = storageKey.toString() + treeId;
        console.log('id in getSizes: ', id);
        // parse number from amount string
        // TODO: Get and parse native / non-native token denomination
        // TODO replace `replaceAll` or target es2021
        // @ts-ignore
        const amountNumber = (Number(amount?.toString().replaceAll(',', '')) * 1.0) / Math.pow(10, 12);
        const currency = cId
          ? Currency.fromORMLAsset(
            webbPolkadot.config.currencies,
            ormlAssets.find((asset) => Number(asset.id) === cId)!
          )
          : Currency.fromCurrencyId(webbPolkadot.config.currencies, Number(cId));
        return {
          id,
          amount: amountNumber,
          currency: currency,
          treeId
        };
      })
      .map(
        ({amount, currency, treeId}) =>
          ({
            id: treeId,
            treeId,
            value: amount,
            title: amount + ` ${currency.view.symbol}`,
            asset: currency.view.symbol,
            amount: amount
          } as MixerSize)
      )
      .sort((a, b) => (a.amount > b.amount ? 1 : a.amount < b.amount ? -1 : 0));
    return groupItem;
  }

  async getSizes() {
    return PolkadotMixerDeposit.getSizes(this.inner);
  }

  async generateNote(mixerId: number, chainId: number): Promise<DepositPayload> {
    logger.info(`Depositing to mixer id ${mixerId}`);
    const chainIdType = computeChainIdType(ChainType.Substrate, internalChainIdToChainId(ChainType.Substrate, chainId));
    const sizes = await this.getSizes();
    const amount = sizes.find((size) => Number(size.id) === mixerId);
    const properties = await this.inner.api.rpc.system.properties();
    const denomination = properties.tokenDecimals.toHuman() || 12;
    if (!amount) {
      throw Error('amount not found! for mixer id ' + mixerId);
    }
    const treeId = amount.id;
    logger.info(`Depositing to tree id ${treeId}`);
    const noteInput: NoteGenInput = {
      protocol: 'mixer',
      version: 'v2',
      exponentiation: '5',
      width: '3',
      backend: 'Arkworks',
      hashFunction: 'Poseidon',
      curve: 'Bn254',
      denomination: `${denomination}`,
      amount: String(amount.amount),
      targetChain: chainIdType.toString(),
      sourceChain: chainIdType.toString(),
      sourceIdentifyingData: treeId.toString(),
      targetIdentifyingData: treeId.toString(),
      tokenSymbol: amount.asset
    };
    logger.info(`noteInput in generateNote: `, noteInput);
    const depositNote = await Note.generateNote(noteInput);
    logger.info(`generated Note from input: `, depositNote.note);
    const leaf = depositNote.getLeaf();

    return {
      note: depositNote,
      params: [Number(treeId), u8aToHex(leaf)]
    };
  }

  async deposit(depositPayload: DepositPayload): Promise<void> {
    const tx = this.inner.txBuilder.build(
      {
        section: 'mixerBn254',
        method: 'deposit'
      },
      depositPayload.params
    );

    const account = await this.inner.accounts.activeOrDefault;
    if (!account) {
      throw WebbError.from(WebbErrorCodes.NoAccountAvailable);
    }
    tx.on('finalize', () => {
      console.log('deposit done');
    });
    tx.on('failed', (e: any) => {
      console.log('deposit failed', e);
    });
    tx.on('extrinsicSuccess', () => {
      console.log('deposit done');
    });
    await tx.call(account.address);
  }
}
