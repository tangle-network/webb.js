// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { assert } from 'chai';

import { TypeRegistry } from '@polkadot/types';
import { hexToU8a, u8aToHex } from '@polkadot/util';

import { AnchorCreateProposal, ChainType, EVMProposal, ProposerSetUpdateProposal } from '../index.js';
import { ProposalHeader } from '../proposals/ProposalHeader.js';
import { AnchorUpdateProposal } from '../proposals/ProposalKinds.js';
import { ResourceId } from '../proposals/ResourceId.js';

describe.only('test various conversion functions', () => {
  it('should encode and decode anchor update proposal types correctly', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const chainId = 0xcafe;
    const chainType = ChainType.EVM;
    const resourceId = new ResourceId(anchorAddress, chainType, chainId);
    const functionSignature = hexToU8a('0xdeadbeef');
    const lastLeafIndex = 0x0000feed;
    const header = new ProposalHeader(
      resourceId,
      functionSignature,
      lastLeafIndex
    );
    const srcChainId = 0xbabe;
    const merkleRoot = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const otherAnchorAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const srcResourceId = new ResourceId(otherAnchorAddress, chainType, srcChainId);
    const updateProposal = new AnchorUpdateProposal(
      header,
      merkleRoot,
      srcResourceId
    );
    const headerEncoded = header.toU8a();
    const headerDecoded = ProposalHeader.fromBytes(headerEncoded);

    assert.equal(headerDecoded.resourceId.toString(), resourceId.toString());
    assert.equal(u8aToHex(headerDecoded.functionSignature), u8aToHex(functionSignature));
    assert.equal(headerDecoded.nonce, lastLeafIndex);

    const updateProposalEncoded = updateProposal.toU8a();
    const updateProposalDecoded = AnchorUpdateProposal.fromBytes(updateProposalEncoded);

    assert.equal(updateProposalDecoded.header.resourceId.toString(), resourceId.toString());
    assert.equal(u8aToHex(updateProposalDecoded.header.functionSignature), u8aToHex(functionSignature));
    assert.equal(updateProposalDecoded.header.nonce, lastLeafIndex);
    assert.equal(updateProposalDecoded.merkleRoot, merkleRoot);
    assert.equal(updateProposalDecoded.srcResourceId.toString(), srcResourceId.toString());
  });

  it('should encode and decode proposer set update proposal types correctly', () => {
    const merkleRoot = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const averageSessionLength = BigInt(10);
    const numberOfProposes = 3;
    const nonce = 1;
    const proposerSetUpdateProposal = new ProposerSetUpdateProposal(
      merkleRoot,
      averageSessionLength,
      numberOfProposes,
      nonce
    );

    const proposerPostdateEncoded = proposerSetUpdateProposal.toU8a();
    const proposerSetUpdateProposalDecoded = ProposerSetUpdateProposal.fromBytes(proposerPostdateEncoded);

    assert.equal(proposerSetUpdateProposalDecoded.merkleRoot, merkleRoot);
    assert.equal(proposerSetUpdateProposalDecoded.nonce, nonce);
    assert.equal(proposerSetUpdateProposalDecoded.averageSessionLength, averageSessionLength);
    assert.equal(proposerSetUpdateProposalDecoded.numberOfProposers, numberOfProposes);
  });

  it('should encode and decode anchor create proposal types correctly', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const chainId = 0xcafe;
    const chainType = ChainType.EVM;
    const resourceId = new ResourceId(anchorAddress, chainType, chainId);
    const functionSignature = hexToU8a('0xdeadbeef');
    const lastLeafIndex = 0x0000feed;
    const header = new ProposalHeader(
      resourceId,
      functionSignature,
      lastLeafIndex
    );
    const encodedCall = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const anchorCreate = new AnchorCreateProposal(
      header,
      encodedCall
    );
    const headerEncoded = header.toU8a();
    const headerDecoded = ProposalHeader.fromBytes(headerEncoded);

    assert.equal(headerDecoded.resourceId.toString(), resourceId.toString());
    assert.equal(u8aToHex(headerDecoded.functionSignature), u8aToHex(functionSignature));
    assert.equal(headerDecoded.nonce, lastLeafIndex);

    const anchorCreateEncoded = anchorCreate.toU8a();
    const anchorCreateDecoded = AnchorCreateProposal.fromBytes(anchorCreateEncoded);

    assert.equal(anchorCreateDecoded.header.resourceId.toString(), resourceId.toString());
    assert.equal(u8aToHex(anchorCreateDecoded.header.functionSignature), u8aToHex(functionSignature));
    assert.equal(anchorCreateDecoded.header.nonce, lastLeafIndex);
    assert.equal(anchorCreateDecoded.encodedCall, encodedCall);
  });
  it('Should encode and decode an evm proposal', () => {
    const t = new TypeRegistry();
    const legacyTransaction = t.createType('LegacyTransaction', {
      action: t.createType('EthTransactionAction', {
        Create: []
      }),
      gasLimit: 400,
      gasPrice: 300,
      input: new Uint8Array(7870),
      nonce: 0,
      signature: {
        r: new Uint8Array(32),
        s: new Uint8Array(32),
        v: t.createType('u64', 3)
      },
      value: 0
    });
    const transactionV2 = t.createType('TransactionV2', {
      Legacy: legacyTransaction
    });

    const evmProposal = new EVMProposal(0, 0, transactionV2);
    const eVMProposalEncoded = evmProposal.toU8a();
    const eVMProposalDecoded = EVMProposal.fromBytes(eVMProposalEncoded);

    assert.equal(eVMProposalDecoded.nonce, 0);
    assert.equal(eVMProposalDecoded.chainId, 0);
  });
});
