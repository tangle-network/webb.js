// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';

import { Codec } from '@polkadot/types/types';

/**
 ** | Value | Property | Description |
 * | 0     | ROUND_UP | Rounds away from zero |
 * | 1     | ROUND_DOWN | Rounds towards zero |
 * | 2     | ROUND_CEIL | Rounds towards Infinity |
 * | 3     | ROUND_FLOOR | Rounds towards -Infinity |
 * | 4     | ROUND_HALF_UP | Rounds towards nearest neighbour, If equidistant, rounds away form zero |
 * | 5     | ROUND_HALF_DOWN | Rounds towards nearest neighbour, If equidistant, rounds towards zero |
 * | 6     | ROUND_HALF_EVEN | Rounds towards nearest neighbour, If equidistant, rounds towards even zero |
 * | 7     | ROUND_HALF_CEIL | Rounds towards nearest neighbour, If equidistant, rounds towards Infinity |
 * | 8     | ROUND_HALF_FLOOR | Rounds towards nearest neighbour, If equidistant, rounds towards -Infinity |
 */
export type ROUND_MODE = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type NumLike = number | string;

/**
 * Fixed point mathematical operation support with 18 decimals
 */
export class Fixed18 {
  private inner: BigNumber;

  /**
   * precision to 18 decimals
   */
  static PRECISION = 10 ** 18;

  /**
   * Zero
   */
  static ZERO = Fixed18.fromNatural(0);

  /**
   * constructor of Fixed18
   * @param  origin - the origin number
   */
  constructor(origin: NumLike | BigNumber) {
    if (origin instanceof BigNumber) {
      this.inner = origin;
    } else {
      this.inner = new BigNumber(origin || 0);
    }

    return this;
  }

  /**
   * get the inner BigNumber value
   */
  public getInner(): BigNumber {
    return this.inner;
  }

  /**
   * Format real number(division by precision) to string
   * @param  dp - decimal places deafult is 6
   * @param  rm - round modle, default is ROUND_FLOOR
   */
  public toString(dp = 6, rm: ROUND_MODE = 3): string {
    let result = this.inner.div(Fixed18.PRECISION);

    result = result.decimalPlaces(dp, rm);

    return result.toString();
  }

  /**
   * Format real number string(division by precision) to string
   * @param  dp - decimal places deafult is 6
   * @param  rm - round modle, default is ROUND_FLOOR
   */
  public toFixed(dp = 6, rm: ROUND_MODE = 3): string {
    let result = this.inner.div(Fixed18.PRECISION);

    result = result.decimalPlaces(dp, rm);

    return result.toFixed();
  }

  /**
   * Format inner BigNumber value to string
   * @param  dp - decimal places deafult is 0
   * @param  rm - round modle, default is ROUND_FLOOR
   */
  public innerToString(dp = 0, rm: ROUND_MODE = 3): string {
    // return 0 if the value is Infinity, -Infinity and NaN
    if (!this.isFinity()) {
      return '0';
    }

    return this.inner.decimalPlaces(dp, rm).toFixed();
  }

  /**
   * Format inner BigNumber value to string
   * @param  dp - decimal places deafult is 0
   * @param  rm - round modle, default is ROUND_FLOOR
   */
  public innerToNumber(dp = 0, rm: ROUND_MODE = 3): number {
    // return 0 if the value is Infinity, -Infinity and NaN
    if (!this.isFinity()) {
      return 0;
    }

    return this.inner.decimalPlaces(dp, rm).toNumber();
  }

  /**
   * Format real number(division by precision) to number
   * @param  dp - decimal places deafult is 6
   * @param  rm - round modle, default is ROUND_FLOOR
   */
  public toNumber(dp = 6, rm: ROUND_MODE = 3): number {
    let result = this.inner.div(Fixed18.PRECISION);

    result = result.decimalPlaces(dp, rm);

    return result.toNumber();
  }

  /**
   * returns a Fixed18 whose value is the value of this Fixed18 rounded by rounding mode roundingMode to a maximum of decimalPlaces decimal places.
   * @param  dp - decimal places
   * @param  rm - round modle, default is ROUND_FLOOR
   */
  public decimalPlaces(dp = 18, rm: ROUND_MODE = 3): Fixed18 {
    return Fixed18.fromNatural(this.toNumber(dp, rm));
  }

  /**
   * get Fixed18 from real number, will multiply by precision
   * @param  target - target number
   */
  static fromNatural(target: NumLike): Fixed18 {
    return new Fixed18(new BigNumber(target).times(Fixed18.PRECISION));
  }

  /**
   * get Fixed18 from real number, will not multiply by precision
   * @param  parts - parts number
   */
  static fromParts(parts: NumLike): Fixed18 {
    return new Fixed18(parts);
  }

  /**
   * @param  n - numerator
   * @param  d - denominator
   */
  static fromRational(n: NumLike, d: NumLike): Fixed18 {
    const _n = new BigNumber(n);
    const _d = new BigNumber(d);

    return new Fixed18(_n.times(Fixed18.PRECISION).div(_d).decimalPlaces(0, 3));
  }

  /**
   *  fixed-point addition operator
   * @param  target - target number
   */
  public add(target: Fixed18): Fixed18 {
    return new Fixed18(this.inner.plus(target.inner).decimalPlaces(0, 3));
  }

  /**
   * fixed-point subtraction operator
   * @param  target - target number
   */
  public sub(target: Fixed18): Fixed18 {
    return new Fixed18(this.inner.minus(target.inner).decimalPlaces(0, 3));
  }

  /**
   *  fixed-point multiplication operator
   * @param  target - target number
   */
  public mul(target: Fixed18): Fixed18 {
    const inner = this.inner.times(target.inner).div(Fixed18.PRECISION).decimalPlaces(0, 3);

    return new Fixed18(inner);
  }

  /**
   * Fixed-point divided operator
   * @param  target - target number
   */
  public div(target: Fixed18): Fixed18 {
    const inner = this.inner.div(target.inner).times(Fixed18.PRECISION).decimalPlaces(0, 3);

    return new Fixed18(inner);
  }

  /**
   * Return true if the value is less than the target value
   * @param  target  - target number
   */
  public isLessThan(target: Fixed18): boolean {
    return this.inner.isLessThan(target.inner);
  }

  /**
   * Return true if the value is greater than the target value
   * @param  target - target number
   */
  public isGreaterThan(target: Fixed18): boolean {
    return this.inner.isGreaterThan(target.inner);
  }

  /**
   *  return true if the values are equal
   * @param  target - target number
   */
  public isEqualTo(target: Fixed18): boolean {
    return this.inner.isEqualTo(target.inner);
  }

  /**
   * Return the max value
   * @param  target - target numbers
   */
  public max(...targets: Fixed18[]): Fixed18 {
    return new Fixed18(BigNumber.max.apply(null, [this.inner, ...targets.map((i) => i.inner)]));
  }

  /**
   * return the min value
   * @param  target - target numbers
   */
  public min(...targets: Fixed18[]): Fixed18 {
    return new Fixed18(BigNumber.min.apply(null, [this.inner, ...targets.map((i) => i.inner)]));
  }

  /**
   * Return the negated value
   */
  public negated(): Fixed18 {
    return new Fixed18(this.inner.negated());
  }

  /**
   * Return true if the value of inner is 0
   */
  public isZero(): boolean {
    return this.inner.isZero();
  }

  /**
   * Return true if the value of inner is NaN
   */
  public isNaN(): boolean {
    return this.inner.isNaN();
  }

  /**
   * Return true if the value of inner is finity, only return false when the value is NaN, -Infinity or Infinity.
   */
  public isFinity(): boolean {
    return this.inner.isFinite();
  }
}

// force to Fixed18
export function convertToFixed18(data: Codec | number | Fixed18): Fixed18 {
  if (data instanceof Fixed18) {
    return data;
  } else if (typeof data === 'number') {
    return Fixed18.fromNatural(data);
  }

  if ('toString' in data) {
    return Fixed18.fromParts(data.toString()); // for Codec
  }

  return Fixed18.ZERO;
}
