// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.

import BigNumber from 'bignumber.js';
import { expect } from 'chai';

import { Fixed18 } from '../fixed-18.js';

describe('fixed 128 constructor', () => {
  it('constructor should work', () => {
    const a = new Fixed18(1);
    const b = new Fixed18('1');
    const c = new Fixed18(new BigNumber(1));

    expect(a).to.deep.equal(b);
    expect(a).to.deep.equal(c);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const d = new Fixed18(); // test for no params

    expect(d).to.deep.equal(Fixed18.ZERO);
  });
  it('from parts should work', () => {
    const a = Fixed18.fromParts(1);

    expect(a.getInner().toNumber()).to.deep.equal(1);
  });
  it('from natural should work', () => {
    const a = Fixed18.fromNatural(1);

    expect(a.getInner().toNumber()).to.deep.equal(1e18);
  });
  it('from rational should work', () => {
    const a = Fixed18.fromRational(10, 2);
    const b = Fixed18.fromRational(100, 20);
    // 0.0000000000000000001 will be 0
    const c = Fixed18.fromRational(1, 10000000000000000000);

    expect(a.toNumber()).to.deep.equal(5);
    expect(a).to.deep.equal(b);
    expect(c).to.deep.equal(Fixed18.ZERO);
  });
});

describe('toFixed should work', () => {
  const a = Fixed18.fromNatural(0.123456789);
  const b = Fixed18.fromNatural(0.00000000001);

  expect(a.toFixed(6)).to.deep.equal('0.123456');
  expect(a.toFixed(9)).to.deep.equal('0.123456789');
  expect(b.toFixed(11)).to.deep.equal('0.00000000001');
  expect(b.toFixed(20)).to.deep.equal('0.00000000001');
  expect(b.toString(11)).to.deep.equal('1e-11');
});

describe('fixed 128 operation', () => {
  const a = Fixed18.fromNatural(10);
  const b = Fixed18.fromNatural(20);

  it('add should work', () => {
    const c = Fixed18.fromNatural(30);

    expect(a.add(b)).to.deep.equal(c);
  });
  it('sub should work', () => {
    const c = Fixed18.fromNatural(-10);

    expect(a.sub(b)).to.deep.equal(c);
  });
  it('mul should work', () => {
    const c = Fixed18.fromNatural(200);

    expect(a.mul(b)).to.deep.equal(c);
  });
  it('div should work', () => {
    const c = Fixed18.fromRational(1, 2);

    expect(a.div(b)).to.deep.equal(c);
  });
  it('div with zero should be Infinity', () => {
    const b = Fixed18.fromNatural(0);
    const c = new Fixed18(Infinity);

    expect(a.div(b)).to.deep.equal(c);
  });
  it('negated should work', () => {
    const c = Fixed18.fromNatural(-10);

    expect(a.negated()).to.deep.equal(c);
  });
});

describe('fixed 128 compare should work', () => {
  const a = Fixed18.fromNatural(10);
  const b = Fixed18.fromNatural(20);

  it('lessThan should work', () => {
    expect(a.isLessThan(b)).to.deep.equal(true);
  });
  it('greaterThan should work', () => {
    expect(a.isGreaterThan(b)).to.deep.equal(false);
  });
  it('isEqual should work', () => {
    const c = Fixed18.fromNatural(10);

    expect(a.isEqualTo(b)).to.deep.equal(false);
    expect(a.isEqualTo(c)).to.deep.equal(true);
  });
  it('max should work', () => {
    expect(a.max(b)).to.deep.equal(b);
    expect(a.min(b)).to.deep.equal(a);
  });
  it('isZero should work', () => {
    const c = Fixed18.ZERO;

    expect(c.isZero()).to.deep.equal(true);
    expect(a.isZero()).to.deep.equal(false);
  });
  it('isInfinite should work', () => {
    const c1 = Fixed18.fromNatural(Infinity);
    const c2 = Fixed18.fromNatural(-Infinity);
    const c3 = Fixed18.fromNatural(NaN);

    expect(c1.isFinity()).to.deep.equal(false);
    expect(c2.isFinity()).to.deep.equal(false);
    expect(c3.isFinity()).to.deep.equal(false);
    expect(a.isFinity()).to.deep.equal(true);
  });
  it('isNaN should work', () => {
    const c = Fixed18.fromNatural(NaN);
    const d = Fixed18.ZERO.div(Fixed18.ZERO);

    expect(a.isNaN()).to.deep.equal(false);
    expect(c.isNaN()).to.deep.equal(true);
    expect(d.isNaN()).to.deep.equal(true);
  });
});

describe('fixed 128 format', () => {
  const a = Fixed18.fromRational(256, 100);

  it('toNumber should work', () => {
    expect(a.toNumber()).to.deep.equal(2.56);
    expect(a.toNumber(1, 2)).to.deep.equal(2.6); // round towards infinity
    expect(a.toNumber(1, 3)).to.deep.equal(2.5); // roound towards -infinity
  });
  it('toString should work', () => {
    expect(a.toString()).to.deep.equal('2.56');
    expect(a.toString(1, 2)).to.deep.equal('2.6'); // round towards infinity
    expect(a.toString(1, 3)).to.deep.equal('2.5'); // round towards -intinity
  });
  it('innerToString should work', () => {
    const b = Fixed18.fromParts(5.5);
    const c1 = Fixed18.fromNatural(NaN);
    const c2 = Fixed18.fromNatural(Infinity);

    expect(a.innerToString()).to.deep.equal('2560000000000000000');
    expect(b.innerToString()).to.deep.equal('5');
    expect(c1.innerToString()).to.deep.equal('0');
    expect(c2.innerToString()).to.deep.equal('0');
  });
});
