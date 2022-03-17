// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import { FixedPointNumber } from '../fixed-point-number';

describe('fixed point number constructor should work', () => {
  it('toString & toNumber', () => {
    const a = FixedPointNumber.fromInner('123456789123456789123456789');
    const b = FixedPointNumber.fromInner('123456789123456781123456789');

    expect(a.toString()).to.deep.equal('123456789.123456789123456789');
    expect(a.toNumber()).to.deep.equal(123456789.12345678);
    expect(b.toNumber()).to.deep.equal(123456789.12345678);
  });
  it('construct from number', () => {
    const a = new FixedPointNumber(1);
    const b = new FixedPointNumber(1, 2);
    const c = FixedPointNumber.fromInner(1e18, 18);

    expect(a._getInner().toString()).to.deep.equal('1000000000000000000');
    expect(a.toString()).to.deep.equal('1');
    expect(b._getInner().toString()).to.deep.equal('100');
    expect(b.toString()).to.deep.equal('1');
    expect(c.toNumber()).to.deep.equal(1);
    expect(c._getInner().toNumber() + 1).to.deep.equal(1e18 + 1);
    expect(FixedPointNumber.fromInner(c._getInner().toNumber() + 1).toNumber(18)).to.deep.equal(1 + 1e-18);
  });

  it('construct from inner', () => {
    const a = FixedPointNumber.fromInner(1000000, 6);

    expect(a.toNumber()).to.deep.equal(1);
  });

  it('no scientific natation', () => {
    const a = new FixedPointNumber(1, 99);
    const b = new FixedPointNumber(1e-99, 1);

    expect(a._getInner().toString()).to.deep.equal(
      '1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    );
    expect(b._getInner().toString()).to.deep.equal(
      '0.00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001'
    );
  });

  it('setPrecision', () => {
    const a = new FixedPointNumber(1000000, 6);
    const b = new FixedPointNumber(1000000, 6);

    b.setPrecision(12);

    expect(a.isEqualTo(b)).to.deep.equal(true);
  });
});

describe('fixed point number calculation should work', () => {
  it('get the absolute value', () => {
    const a = new FixedPointNumber(-1);
    const b = new FixedPointNumber(1);

    expect(a.abs().toNumber()).to.deep.equal(1);
    expect(b.abs().toNumber()).to.deep.equal(1);
  });

  it('plus', () => {
    const a = new FixedPointNumber(100);
    const b = new FixedPointNumber(100);

    const c = new FixedPointNumber(100, 18);
    const d = new FixedPointNumber(100, 16);

    const e = FixedPointNumber.fromInner(100, 2);
    const f = FixedPointNumber.fromInner(100, 4);

    expect(a.plus(b).toNumber()).to.deep.equal(200);
    expect(c.plus(d).toNumber()).to.deep.equal(200);

    expect(e.plus(f).toNumber()).to.deep.equal(1.01);
  });

  it('minus', () => {
    const a = new FixedPointNumber(200);
    const b = new FixedPointNumber(100);

    const c = new FixedPointNumber(200, 18);
    const d = new FixedPointNumber(100, 16);

    const e = FixedPointNumber.fromInner(100, 2);
    const f = FixedPointNumber.fromInner(100, 4);

    expect(a.minus(b).toNumber()).to.deep.equal(100);
    expect(c.minus(d).toNumber()).to.deep.equal(100);

    expect(e.minus(f).toNumber()).to.deep.equal(0.99);
  });

  it('times', () => {
    const a = new FixedPointNumber(100);
    const b = new FixedPointNumber(100);

    const c = new FixedPointNumber(100, 18);
    const d = new FixedPointNumber(100, 16);

    const e = FixedPointNumber.fromInner(100, 2);
    const f = FixedPointNumber.fromInner(100, 4);

    expect(a.times(b).toNumber()).to.deep.equal(10000);
    expect(c.times(d).toNumber()).to.deep.equal(10000);

    expect(e.times(f).toNumber()).to.deep.equal(0.01);
  });

  it('div', () => {
    const a = new FixedPointNumber(200);
    const b = new FixedPointNumber(100);

    const c = new FixedPointNumber(200, 18);
    const d = new FixedPointNumber(100, 16);

    const e = FixedPointNumber.fromInner(100, 2);
    const f = FixedPointNumber.fromInner(100, 4);

    const n = new FixedPointNumber(100, 2);
    const m = new FixedPointNumber(3, 2);

    expect(a.div(b).toNumber()).to.deep.equal(2);
    expect(c.div(d).toNumber()).to.deep.equal(2);

    expect(e.div(f).toNumber()).to.deep.equal(100);

    expect(n.div(m).toNumber(2)).to.deep.equal(33.33);
  });
});

describe('fixed point number compare should work', () => {
  it('isZero', () => {
    const a = new FixedPointNumber(0);
    const b = new FixedPointNumber(1);

    expect(a.isZero()).to.deep.equal(true);
    expect(b.isZero()).to.deep.equal(false);
  });

  it('isNaN', () => {
    const a = new FixedPointNumber(NaN);
    const b = new FixedPointNumber(0);
    const c = new FixedPointNumber(0);
    const d = new FixedPointNumber(1);

    expect(a.isNaN()).to.deep.equal(true);
    expect(b.div(c).isNaN()).to.deep.equal(true);
    expect(d.isNaN()).to.deep.equal(false);
  });

  it('isNegative', () => {
    const a = new FixedPointNumber(NaN);
    const b = new FixedPointNumber(1);
    const c = new FixedPointNumber(-1);

    expect(a.isNegative()).to.deep.equal(false);
    expect(b.isNegative()).to.deep.equal(false);
    expect(c.isNegative()).to.deep.equal(true);
  });

  it('isPositive', () => {
    const a = new FixedPointNumber(NaN);
    const b = new FixedPointNumber(1);
    const c = new FixedPointNumber(-1);

    expect(a.isPositive()).to.deep.equal(false);
    expect(b.isPositive()).to.deep.equal(true);
    expect(c.isPositive()).to.deep.equal(false);
  });

  it('isGreaterThan', () => {
    const a = new FixedPointNumber(2);
    const b = new FixedPointNumber(1);
    const c = new FixedPointNumber(-1);

    expect(a.isGreaterThan(b)).to.deep.equal(true);
    expect(a.isGreaterThan(c)).to.deep.equal(true);
    expect(b.isGreaterThan(a)).to.deep.equal(false);
    expect(c.isGreaterThan(a)).to.deep.equal(false);
  });

  it('isGreaterOrEqualThan', () => {
    const a = new FixedPointNumber(2);
    const b = new FixedPointNumber(1);
    const c = new FixedPointNumber(2);

    expect(a.isGreaterThanOrEqualTo(b)).to.deep.equal(true);
    expect(a.isGreaterThanOrEqualTo(c)).to.deep.equal(true);
  });

  it('isLessThan', () => {
    const a = new FixedPointNumber(2);
    const b = new FixedPointNumber(10);

    expect(a.isLessThan(b)).to.deep.equal(true);
    expect(b.isLessThan(a)).to.deep.equal(false);
  });

  it('isLessThan', () => {
    const a = new FixedPointNumber(2);
    const b = new FixedPointNumber(10);
    const c = new FixedPointNumber(2);

    expect(b.isLessOrEqualTo(a)).to.deep.equal(false);
    expect(a.isLessOrEqualTo(b)).to.deep.equal(true);
    expect(a.isLessOrEqualTo(c)).to.deep.equal(true);
  });

  it('isEqualTo', () => {
    const a = new FixedPointNumber(2, 2);
    const b = new FixedPointNumber(2, 3);

    expect(a.isEqualTo(b)).to.deep.equal(true);
  });

  it('min max', () => {
    const a = new FixedPointNumber(2, 2);
    const b = new FixedPointNumber(2, 3);
    const c = new FixedPointNumber(2, 18);
    const d = new FixedPointNumber(4, 3);

    expect(a.max(b).toString()).to.deep.equal(b.toString());
    expect(a.min(b).toString()).to.deep.equal(b.toString());
    expect(a.max(c).toString()).to.deep.equal(c.toString());
    expect(a.min(c).toString()).to.deep.equal(c.toString());
    expect(a.max(d).toString()).to.deep.equal(d.toString());
    expect(a.min(d).toString()).to.deep.equal(a.toString());
  });

  it('trunc frac', () => {
    const a = FixedPointNumber.fromRational(5, 2);
    const a1 = a.trunc();
    const a2 = a.frac();

    expect(a1.plus(a2).toString()).to.deep.equal(a.toString());

    const b = FixedPointNumber.fromRational(5, 2).frac().times(FixedPointNumber.TEN);

    expect(b.toString()).to.deep.equal(FixedPointNumber.FIVE.toString());

    const c = FixedPointNumber.fromRational(-5, 2);
    const c1 = c.trunc();
    const c2 = c.frac();

    console.log(c1.toString(), c2.toString());

    expect(c1.minus(c2).toString()).to.deep.equal(c.toString());
    expect(c2.times(FixedPointNumber.TEN).toString()).to.deep.equal(FixedPointNumber.FIVE.toString());

    const d = FixedPointNumber.fromRational(-1, 2).frac().times(FixedPointNumber.TEN);

    expect(d.toString()).to.deep.equal(FixedPointNumber.ZERO.minus(FixedPointNumber.FIVE).toString());
  });
});
