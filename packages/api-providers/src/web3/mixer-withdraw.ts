// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { depositFromAnchorNote, getEVMChainNameFromInternal, webbCurrencyIdFromString } from '@webb-tools/api-providers/index.js';
import { LoggerService } from '@webb-tools/app-util/index.js';
import { Note } from '@webb-tools/sdk-core/index.js';

import { Bridge, WithdrawState } from '../abstracts/index.js';
import { evmIdIntoInternalChainId } from '../chains/index.js';
import { Web3AnchorWithdraw } from './anchor-withdraw.js';

const logger = LoggerService.get('Web3MixerWithdraw');

// The Web3Mixer Withdraw uses anchor withdraw, with the same target and source chain id.
export class Web3MixerWithdraw extends Web3AnchorWithdraw {
  // Withdraw is overriden to emit notifications specific to the
  async withdraw (note: string, recipient: string): Promise<string> {
    logger.trace(`Withdraw using note ${note} , recipient ${recipient}`);

    const parseNote = await Note.deserialize(note);
    const depositNote = parseNote.note;

    this.cancelToken.cancelled = false;

    const bridgeCurrencyId = webbCurrencyIdFromString(depositNote.tokenSymbol);
    const bridge = Bridge.from(bridgeCurrencyId, this.inner.config);

    const activeChain = await this.inner.getChainId();
    const internalId = evmIdIntoInternalChainId(activeChain);

    const contractAddresses = bridge.anchors.find((anchor) => anchor.amount === depositNote.amount)!;
    const contractAddress = contractAddresses.anchorAddresses[internalId]!;

    const contract = this.inner.getWebbAnchorByAddress(contractAddress);
    const accounts = await this.inner.accounts.accounts();
    const account = accounts[0];

    const deposit = depositFromAnchorNote(depositNote);

    logger.info(`Commitment for withdraw is ${deposit.commitment}`);

    const input = {
      destinationChainId: activeChain,
      fee: 0,
      nullifier: deposit.nullifier,
      // Todo change this to the RELAYER address
      nullifierHash: deposit.nullifierHash,
      recipient: account.address,
      refund: 0,
      relayer: account.address,
      secret: deposit.secret
    };

    logger.trace('input for zkp', input);
    const section = `Bridge ${bridge.currency
      .getChainIds()
      .map((id) => getEVMChainNameFromInternal(this.config, id))
      .join('-')}`;
    const key = 'web3-bridge-withdraw';

    this.emit('stateChange', WithdrawState.GeneratingZk);
    const zkpResults = await contract.generateZKP(deposit, input);

    this.inner.notificationHandler({
      description: 'Withdraw in progress',
      key,
      level: 'loading',
      message: `${section}:withdraw`,
      name: 'Transaction'
    });

    // Check for cancelled here, abort if it was set.
    if (this.cancelToken.cancelled) {
      this.inner.notificationHandler({
        description: 'Withdraw canceled',
        key,
        level: 'error',
        message: `${section}:withdraw`,
        name: 'Transaction'
      });
      this.emit('stateChange', WithdrawState.Ideal);

      return '';
    }

    let txHash = '';

    this.emit('stateChange', WithdrawState.SendingTransaction);

    try {
      txHash = await contract.withdraw(
        zkpResults.proof,
        {
          destinationChainId: Number(depositNote.targetChainId),
          fee: input.fee,
          nullifier: input.nullifier,
          nullifierHash: input.nullifierHash,
          pathElements: zkpResults.input.pathElements,
          pathIndices: zkpResults.input.pathIndices,
          recipient: input.recipient,
          refund: input.refund,
          relayer: input.relayer,
          root: zkpResults.root as any,
          secret: zkpResults.input.secret
        },
        zkpResults.input
      );
    } catch (e) {
      this.emit('stateChange', WithdrawState.Ideal);

      this.inner.notificationHandler({
        description: (e as any)?.code === 4001 ? 'Withdraw rejected' : 'Withdraw failed',
        key,
        level: 'error',
        message: `${section}:withdraw`,
        name: 'Transaction'
      });

      return txHash;
    }

    this.emit('stateChange', WithdrawState.Ideal);
    this.inner.notificationHandler({
      description: recipient,
      key,
      level: 'success',
      message: `${section}:withdraw`,
      name: 'Transaction'
    });

    return '';
  }
}
