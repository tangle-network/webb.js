// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { assert } from 'chai';
import { parseTransaction } from 'ethers/lib/utils';

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
    const tx = parseTransaction('0xf86e821d5a8506fcda247482753094378cdc4e9e9bccd7aeda011888ecf6a8528271fb8801123d5fd0f473118025a0eca14f413c016d65c0de0f31d7a7e090a3f6def4a0d2cebb9034baedf4198821a02d15f8593f161732b4b3f6688b68d5e6d560aaf0bbf2a22dc99db368d1fcdceb');
    const evmProposal = new EVMProposal(0, 0, tx);
    const eVMProposalEncoded = evmProposal.toU8a();
    const eVMProposalDecoded = EVMProposal.fromBytes(eVMProposalEncoded);

    assert.equal(eVMProposalDecoded.nonce, 0);
    assert.equal(eVMProposalDecoded.chainId, 0);
  });
});
