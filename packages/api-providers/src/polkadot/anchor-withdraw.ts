// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { fetchSubstrateAnchorProvingKey } from '@webb-tools/api-providers/ipfs/substrate/anchor';
import { LoggerService } from '@webb-tools/app-util';
import { Note, ProvingManager, ProvingManagerSetupInput } from '@webb-tools/sdk-core';

import { decodeAddress } from '@polkadot/keyring';
import { hexToU8a, u8aToHex } from '@polkadot/util';

import { AnchorWithdraw, WithdrawState } from '../abstracts';
import { InternalChainId } from '../chains';
import { WebbError, WebbErrorCodes } from '../webb-error';
import { WebbPolkadot } from './webb-provider';

const logger = LoggerService.get('PolkadotBridgeWithdraw');

export type AnchorWithdrawProof = {
  id: string;
  proofBytes: string;
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: number;
  refund: number;
  refreshCommitment: string;
};

export class PolkadotAnchorWithdraw extends AnchorWithdraw<WebbPolkadot> {
  async fetchRPCTreeLeaves (treeId: string | number): Promise<Uint8Array[]> {
    logger.trace(`Fetching leaves for tree with id ${treeId}`);
    let done = false;
    let from = 0;
    let to = 511;
    const leaves: Uint8Array[] = [];

    while (done === false) {
      const treeLeaves: any[] = await (this.inner.api.rpc as any).mt.getLeaves(treeId, from, to);

      if (treeLeaves.length === 0) {
        done = true;
        break;
      }

      leaves.push(...treeLeaves.map((i) => i.toU8a()));
      from = to;
      to = to + 511;
    }

    return leaves;
  }

  async fetchRoot (treeId: string) {
    logger.trace(`fetching metadata for tree id ${treeId}`);
    const storage =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await this.inner.api.query.merkleTreeBn254.trees(treeId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return storage.toHuman().root;
  }

  async withdraw (note: string, recipient: string): Promise<string> {
    // TODO: implement cross chain
    // TODO: Integrate with Substrate relayer
    // TODO handle the cached roots
    try {
      const account = await this.inner.accounts.activeOrDefault;

      if (!account) {
        throw WebbError.from(WebbErrorCodes.NoAccountAvailable);
      }

      const accountId = account.address;
      const relayerAccountId = account.address;

      this.emit('stateChange', WithdrawState.GeneratingZk);
      logger.trace(`Withdraw using note ${note} , recipient ${recipient}`);
      const parseNote = await Note.deserialize(note);
      const depositNote = parseNote.note;
      const amount = parseNote.note.amount;
      const anchors = await this.inner.methods.anchorApi.getAnchors();
      const anchor = anchors.find((a) => a.amount === amount)!;
      const treeId = anchor.neighbours[InternalChainId.WebbDevelopment] as string;

      const leaves = await this.fetchRPCTreeLeaves(treeId);
      const leaf = depositNote.getLeafCommitment();
      const leafHex = u8aToHex(leaf);
      const leafIndex = leaves.findIndex((leaf) => u8aToHex(leaf) === leafHex);

      logger.trace(leaves.map((i) => u8aToHex(i)));
      const worker = this.inner.wasmFactory('wasm-utils');
      const pm = new ProvingManager(worker);

      const recipientAccountHex = u8aToHex(decodeAddress(recipient));
      const relayerAccountHex = u8aToHex(decodeAddress(recipient));
      const provingKey = await fetchSubstrateAnchorProvingKey();
      const refreshCommitment = '0000000000000000000000000000000000000000000000000000000000000000';
      const root = await this.fetchRoot(treeId);

      const proofInput: ProvingManagerSetupInput = {
        fee: 0,
        leafIndex,
        leaves,
        note,
        provingKey,
        recipient: recipientAccountHex.replace('0x', ''),
        refreshCommitment,
        refund: 0,
        relayer: relayerAccountHex.replace('0x', ''),
        roots: [hexToU8a(root), hexToU8a(root)]
      };

      logger.log('proofInput to webb.js: ', proofInput);
      const zkProofMetadata = await pm.prove(proofInput);
      const withdrawProof: AnchorWithdrawProof = {
        fee: 0,
        id: treeId,
        nullifierHash: `0x${zkProofMetadata.nullifierHash}`,
        proofBytes: `0x${zkProofMetadata.proof}` as any,
        recipient: accountId,
        refreshCommitment: `0x${refreshCommitment}`,
        refund: 0,
        relayer: relayerAccountId,
        root: `0x${zkProofMetadata.root}`
      };
      const parms = [
        withdrawProof.id,
        withdrawProof.proofBytes,
        zkProofMetadata.roots.map((i: string) => `0x${i}`),
        withdrawProof.nullifierHash,
        withdrawProof.recipient,
        withdrawProof.relayer,
        withdrawProof.fee,
        withdrawProof.refund,
        withdrawProof.refreshCommitment
      ];

      this.emit('stateChange', WithdrawState.SendingTransaction);
      const tx = this.inner.txBuilder.build(
        {
          method: 'withdraw',
          section: 'anchorBn254'
        },
        parms
      );
      const hash = await tx.call(account.address);

      this.emit('stateChange', WithdrawState.Done);

      return hash || '';
    } catch (e) {
      this.emit('stateChange', WithdrawState.Failed);
      throw e;
    }
  }
}
