// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.

import { ApiPromise, ApiRx } from '@polkadot/api';
import { U32 } from '@polkadot/types';

import { FixedPointNumber } from './fixed-point-number.js';
import { CHAIN } from './type.js';

export type CurrencyId = U32;

export interface TokenConfig {
  chain?: CHAIN; // which chain the token is in
  name: string; // The name of the token
  symbol?: string; // short name of the token
  precision?: number; // the precision of the token
  amount?: number | string | FixedPointNumber; // the amount of the token
}

// preset token type
export type PresetToken = 'EDG' | 'WEBB' | 'DEV';

// common tokens config in acala network and polkadot
export const presetTokensConfig: Record<CHAIN, Record<PresetToken, TokenConfig>> = {
  dev: {
    DEV: {
      chain: 'dev',
      name: 'DEV',
      precision: 12,
      symbol: 'DEV'
    }
  } as Record<PresetToken, TokenConfig>,
  webb: {
    WEBB: {
      chain: 'webb',
      name: 'WEBB',
      precision: 18,
      symbol: 'WEBB'
    }
  } as Record<PresetToken, TokenConfig>
};

export const TokenAmount = FixedPointNumber;

export class Token {
  readonly chain!: CHAIN;
  // keep all properties about token readonly
  readonly name!: string;
  readonly symbol!: string;
  readonly precision!: number;
  public amount!: FixedPointNumber;

  constructor (config: TokenConfig) {
    this.name = config.name;
    this.symbol = config.symbol || config.name;
    this.precision = config.precision || 18;
    this.chain = config.chain || 'dev';

    if (config.amount) {
      if (config.amount instanceof FixedPointNumber) {
        this.amount = config.amount;
      } else {
        this.amount = new TokenAmount(config.amount || 0, this.precision);
      }
    }
  }

  public isEqual (token: Token): boolean {
    return this.chain === token.chain && this.name === token.name;
  }

  public toString (): string {
    return this.name;
  }

  public toChainData (): { Token: string } | string {
    return this.name;
  }

  public clone (newConfig?: Partial<TokenConfig>): Token {
    return new Token({
      amount: newConfig?.amount || this.amount || new FixedPointNumber(0),
      chain: newConfig?.chain || this.chain || '',
      name: newConfig?.name || this.name || '',
      precision: newConfig?.precision || this.precision || 0,
      symbol: newConfig?.symbol || this.symbol || ''
    });
  }
}

function convert (config: Record<CHAIN, Record<string, TokenConfig>>): Record<CHAIN, Record<string, Token>> {
  return Object.keys(config).reduce((prev, chain) => {
    prev[chain as CHAIN] = Object.keys(config[chain as CHAIN]).reduce((prev, name) => {
      prev[name] = new Token(config[chain as CHAIN][name]);

      return prev;
    }, {} as Record<string, Token>);

    return prev;
  }, {} as Record<CHAIN, Record<string, Token>>);
}

export const PRESET_TOKENS = convert(presetTokensConfig);

export function getPresetToken (name: PresetToken, chain: CHAIN = 'webb'): Token {
  return PRESET_TOKENS[chain][name];
}

const TOKEN_SORT: Record<string, number> = {
  WEBB: 0
};

const Tokens: Array<PresetToken> = ['WEBB'];

export function sortTokens (token1: Token, token2: Token, ...other: Token[]): Token[] {
  const result = [token1, token2, ...other];

  return result.sort((a, b) => TOKEN_SORT[a.name] - TOKEN_SORT[b.name]);
}

export function token2CurrencyId (api: ApiPromise | ApiRx, token: Token): CurrencyId {
  return api.createType('CurrencyId', token.toChainData());
}

export function currencyId2Token (token: CurrencyId): Token {
  return getPresetToken(Tokens[token.toNumber()]);
}
