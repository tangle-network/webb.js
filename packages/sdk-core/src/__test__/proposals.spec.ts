// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

import { assert } from 'chai';

import { ProposalHeader } from '../proposals/ProposalHeader.js';
import { AnchorUpdateProposal } from '../proposals/ProposalKinds.js';
import { ChainIdType, ResourceId } from '../proposals/ResourceId.js';

describe('test various conversion functions', () => {
  it('should encode and decode primitive proposal types correctly', () => {
    const anchorAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const chainId = 0xcafe;
    const chainIdType = ChainIdType.EVM;
    const resourceId = new ResourceId(anchorAddress, chainIdType, chainId);
    const functionSignature = '0xdeadbeef';
    const nonce = 0xdad;
    const header = new ProposalHeader(
      resourceId,
      functionSignature,
      nonce
    );
    const srcChainId = 0xbabe;
    const lastLeafIndex = 0xfeed;
    const merkleRoot = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const otherAnchorAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const srcResourceId = new ResourceId(otherAnchorAddress, chainIdType, srcChainId);
    const updateProposal = new AnchorUpdateProposal(
      header,
      merkleRoot,
      srcResourceId
    );
    const headerEncoded = header.toU8a();
    const headerDecoded = ProposalHeader.fromBytes(headerEncoded);

    assert.equal(headerDecoded.resourceId, resourceId);
    assert.equal(headerDecoded.functionSignature, functionSignature);
    assert.equal(headerDecoded.nonce, nonce);

    const updateProposalEncoded = updateProposal.toU8a();
    const updateProposalDecoded = AnchorUpdateProposal.fromBytes(updateProposalEncoded);

    assert.equal(updateProposalDecoded.header.resourceId, resourceId);
    assert.equal(updateProposalDecoded.header.functionSignature, functionSignature);
    assert.equal(updateProposalDecoded.header.nonce, lastLeafIndex);
    assert.equal(updateProposalDecoded.merkleRoot, merkleRoot);
    assert.equal(updateProposalDecoded.srcResourceId, srcResourceId);
  });
});
