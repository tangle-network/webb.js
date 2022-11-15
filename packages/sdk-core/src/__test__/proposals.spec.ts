// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { assert } from 'chai';
import { utils } from 'ethers';

import { hexToU8a, u8aToHex } from '@polkadot/util';

import { AnchorCreateProposal, ChainType, EVMProposal, MinWithdrawalLimitProposal, ProposerSetUpdateProposal, RefreshVoteProposal, TokenAddProposal, TokenRemoveProposal, WrappingFeeUpdateProposal } from '../index.js';
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
  it('Should encode and decode  evm proposal', () => {
    const tx = utils.parseTransaction('0x02f901fb018265708414077824850f609e3a0a83012c6f94f4c62b4f8b7b1b1c4ba88bfd3a8ea392641516e98726f8e5ab97bbd5b90184e3a54629000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000050000000000000000000000003696ce3b3d62326bc54ee471b329df7c60d94c2900000000000000000000000000000000000000000000000000091a706b2d1f7e0000000000000000000000002bdf24d26391195668acdf429c26c605b72029700000000000000000000000000000000000000000000000000007c575c8277aaf0000000000000000000000008da6869b882f27a0624e8a6736ef77ade0124adb0000000000000000000000000000000000000000000000000008bbcfdd814df50000000000000000000000006d4d6a996a670f80751f52c9c121710c06512a230000000000000000000000000000000000000000000000000008bc4ae2731e45000000000000000000000000214872c00ef77571916bf6773ab017cb5623b1410000000000000000000000000000000000000000000000000004a0e4b84eb56ec080a04f866699aaaefd51ca25e1202b7c7326184743888c191d2a13a16de013da2f84a07ac203cc7e5a0c7a390f6115be844d85db6892e681a3a7b4eb0f028909802548');

    const evmProposal = new EVMProposal(tx.chainId, tx.nonce, tx);
    const eVMProposalEncoded = evmProposal.toU8a();
    const eVMProposalDecoded = EVMProposal.fromBytes(eVMProposalEncoded);

    assert.equal(eVMProposalDecoded.nonce, tx.nonce);
    assert.equal(eVMProposalDecoded.chainId, tx.chainId);
  });

  it('Should encode and decode  refresh vote proposal', () => {
    const publicKey = '0x020258d309d321e1108e1f055100b86df5d104ca589c1349e5731ef82b19ade12b';
    const nonce = 0;

    const refreshVoteProposal = new RefreshVoteProposal(nonce, publicKey);
    const refreshVoteProposalEncoded = refreshVoteProposal.toU8a();
    const refreshVoteProposalDecoded = RefreshVoteProposal.fromBytes(refreshVoteProposalEncoded);

    assert.equal(refreshVoteProposalDecoded.nonce, nonce);
    assert.equal(refreshVoteProposalDecoded.publicKey, publicKey);
  });

  it('Should encode and decode  proposer set update proposal', () => {
    const merkleRoot = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const averageSessionLength = BigInt(10);
    const nonce = 0;
    const numberOfProposers = 10;

    const proposerSetUpdateProposal = new ProposerSetUpdateProposal(
      merkleRoot,
      averageSessionLength,
      numberOfProposers,
      nonce
    );
    const proposerSetUpdateProposalEncoded = proposerSetUpdateProposal.toU8a();
    const proposerSetUpdateProposalDecoded = ProposerSetUpdateProposal.fromBytes(proposerSetUpdateProposalEncoded);

    assert.equal(proposerSetUpdateProposalDecoded.merkleRoot, merkleRoot);
    assert.equal(proposerSetUpdateProposalDecoded.averageSessionLength, averageSessionLength);
    assert.equal(proposerSetUpdateProposalDecoded.numberOfProposers, numberOfProposers);
    assert.equal(proposerSetUpdateProposalDecoded.nonce, nonce);
  });

  it('Should encode and decode token add proposal', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const newTokenAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab';
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

    const tokenAddProposal = new TokenAddProposal(header, newTokenAddress);
    const tokenAddProposalEncoded = tokenAddProposal.toU8a();
    const tokenAddProposalDecoded = TokenAddProposal.fromBytes(tokenAddProposalEncoded);

    assert.equal(tokenAddProposalDecoded.newTokenAddress, newTokenAddress);
    assert.equal(tokenAddProposalDecoded.header.toString(), header.toString());
  });

  it('Should encode and decode  token remove proposal', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const removedTokenAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab';
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

    const tokenRemoveProposal = new TokenRemoveProposal(header, removedTokenAddress);
    const tokenRemoveProposalEncoded = tokenRemoveProposal.toU8a();
    const tokenRemoveProposalDecoded = TokenRemoveProposal.fromBytes(tokenRemoveProposalEncoded);

    assert.equal(tokenRemoveProposalDecoded.removeTokenAddress, removedTokenAddress);
    assert.equal(tokenRemoveProposalDecoded.header.toString(), header.toString());
  });

  it('Should encode and decode  wrapping fee update proposal', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const newFee = '0x1011';
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

    const wrappingFeeUpdateProposal = new WrappingFeeUpdateProposal(header, newFee);
    const wrappingFeeUpdateProposalEncoded = wrappingFeeUpdateProposal.toU8a();
    const wrappingFeeUpdateProposalDecoded = WrappingFeeUpdateProposal.fromBytes(wrappingFeeUpdateProposalEncoded);

    assert.equal(wrappingFeeUpdateProposalDecoded.newFee, newFee);
    assert.equal(wrappingFeeUpdateProposalDecoded.header.toString(), header.toString());
  });

  it('Should encode and decode  min withdraw limit proposal', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const minWithdrawalLimitBytes = '0x0000000000000000000000000000000000000000000000000000000000001111';
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

    const minWithdrawLimitProposal = new MinWithdrawalLimitProposal(header, minWithdrawalLimitBytes);
    const minWithdrawLimitProposalEncoded = minWithdrawLimitProposal.toU8a();
    const minWithdrawLimitProposalDecoded = MinWithdrawalLimitProposal.fromBytes(minWithdrawLimitProposalEncoded);

    assert.equal(minWithdrawLimitProposalDecoded.minWithdrawalLimitBytes, minWithdrawalLimitBytes);
    assert.equal(minWithdrawLimitProposalDecoded.header.toString(), header.toString());
  });
});
