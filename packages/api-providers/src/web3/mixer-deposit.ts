// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { getEVMChainName, getNativeCurrencySymbol } from '@webb-tools/api-providers/utils/index.js';
import { Note, NoteGenInput } from '@webb-tools/sdk-core/index.js';
import utils from 'web3-utils';

import { u8aToHex } from '@polkadot/util';

import { DepositPayload as IDepositPayload, MixerDeposit, MixerSize } from '../abstracts/index.js';
import { ChainType, computeChainIdType, parseChainIdType } from '../chains/index.js';
import { createTornDeposit, Deposit } from '../contracts/utils/make-deposit.js';
import { WebbWeb3Provider } from './webb-provider.js';

type DepositPayload = IDepositPayload<Note, [Deposit, number]>;

export class Web3MixerDeposit extends MixerDeposit<WebbWeb3Provider, DepositPayload> {
  async deposit ({ note: depositPayload, params }: DepositPayload): Promise<void> {
    const chainId = Number(depositPayload.note.targetChainId);
    const evmChainId = parseChainIdType(chainId).chainId;

    this.inner.notificationHandler({
      data: {
        amount: String(Number(depositPayload.note.amount)),
        chain: getEVMChainName(this.inner.config, evmChainId),
        currency: depositPayload.note.tokenSymbol
      },
      description: 'Depositing',
      key: 'web3-mixer-deposit',
      level: 'loading',
      message: 'mixer:deposit',
      name: 'Transaction'
    });
    const [deposit, amount] = params;
    const providerEvmChainId = await this.inner.getChainId();
    const contract = await this.inner.getContractBySize(
      amount,
      getNativeCurrencySymbol(this.inner.config, providerEvmChainId)
    );

    try {
      await contract.deposit(deposit.commitment);
      this.inner.notificationHandler({
        description: 'Deposit succeed',
        key: 'web3-mixer-deposit',
        level: 'success',
        message: 'mixer:deposit',
        name: 'Transaction'
      });
    } catch (e) {
      if ((e as any)?.code === 4001) {
        this.inner.notificationHandler({
          description: 'User Rejected Deposit',
          key: 'web3-mixer-deposit',
          level: 'error',
          message: 'mixer:deposit',
          name: 'Transaction'
        });
      } else {
        this.inner.notificationHandler({
          description: 'Deposit Failed',
          key: 'web3-mixer-deposit',
          level: 'error',
          message: 'mixer:deposit',
          name: 'Transaction'
        });
      }
    }
  }

  async generateNote (mixerAddress: string): Promise<DepositPayload> {
    const contract = await this.inner.getContractByAddress(mixerAddress);
    const mixerInfo = this.inner.getMixers().getMixerInfoByAddress(mixerAddress);

    if (!mixerInfo) {
      throw new Error('mixer not found from storage');
    }

    const depositSizeBN = await contract.denomination;
    const depositSize = Number.parseFloat(utils.fromWei(depositSizeBN.toString(), 'ether'));
    const chainId = await this.inner.getChainId();
    const deposit = createTornDeposit();
    const noteChain = computeChainIdType(ChainType.EVM, chainId);
    const secrets = deposit.preimage;
    const noteInput: NoteGenInput = {
      amount: String(depositSize),
      backend: 'Circom',
      curve: 'Bn254',
      denomination: '18',
      exponentiation: '5',
      hashFunction: 'Poseidon',
      protocol: 'mixer',
      secrets: u8aToHex(secrets),
      sourceChain: noteChain.toString(),
      sourceIdentifyingData: mixerAddress,
      targetChain: noteChain.toString(),
      targetIdentifyingData: mixerAddress,
      tokenSymbol: mixerInfo.symbol,
      version: 'v2',
      width: '3'
    };
    const note = await Note.generateNote(noteInput);

    return {
      note: note,
      params: [deposit, mixerInfo.size]
    };
  }

  async getSizes (): Promise<MixerSize[]> {
    const chainId = await this.inner.getChainId();

    return this.inner.getMixerSizes(getNativeCurrencySymbol(this.inner.config, chainId));
  }
}
