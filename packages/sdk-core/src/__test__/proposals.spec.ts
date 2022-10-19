// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { assert } from 'chai';

import { TypeRegistry } from '@polkadot/types';
import { hexToU8a, u8aToHex } from '@polkadot/util';

import { AnchorCreateProposal, ChainType, EVMProposal, ProposerSetUpdateProposal } from '../index.js';
import { ProposalHeader } from '../proposals/ProposalHeader.js';
import { AnchorUpdateProposal } from '../proposals/ProposalKinds.js';
import { ResourceId } from '../proposals/ResourceId.js';

describe('test various conversion functions', () => {
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
      input: hexToU8a('0xf17a454600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000003f18ef30000000000000000000000000000000000000000000000000000000003e7767ad000000000000000000000000c6cf51f57969129654c5014748e44e2a8f6ebd81000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000003f18ef30000000000000000000000000e7b0ce0526fbe3969035a145c9e9691d4d9d216c000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a98f8043eb2c880765c952970988cd12d0b8664d00000000000000000000000000000000000000000000000000000000000000c8050203001b010001021cbc51eeea0b3d732211d7dba4cb7615f470939a704511ed19c09ace4b099bb8027563496fa2f009483e8e3fbc6e7ca02de9b9513825f5e623d1476d42813be6950000000000000000000000003f18ef300000000000000000000000003f18ef300000000005f5e1000000000005f5e10000b1a2bc2ec5000000bc0131634fe65b020202ff000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000000000000000000000000000'),
      nonce: 0,
      signature: {
        r: hexToU8a('0x0000'),
        s: hexToU8a('0x0000'),
        v: '300'
      },
      value: 0
    });
    const transactionV2 = t.createType('TransactionV2', {
      Legacy: legacyTransaction
    });

    const evmProposal = new EVMProposal(0, 0, transactionV2);
    const eVMProposalEncoded = evmProposal.toBytes();
    const eVMProposalDecoded = EVMProposal.fromBytes(eVMProposalEncoded);

    assert.equal(eVMProposalDecoded.nonce, 0);
    assert.equal(eVMProposalDecoded.chainId, 0);
  });
});
