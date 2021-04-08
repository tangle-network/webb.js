import { FixedPointNumber } from './fixed-point-number';
import { CHAIN } from './type';
import { ApiPromise, ApiRx } from '@polkadot/api';
import { CurrencyId } from '@webb-tools/types/interfaces';

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
  edgeware: {
    EDG: {
      chain: 'edgeware',
      name: 'EDG',
      symbol: 'EDG',
      precision: 18
    }
  } as Record<PresetToken, TokenConfig>,
  dev: {
    DEV: {
      chain: 'dev',
      name: 'DEV',
      symbol: 'DEV',
      precision: 12
    }
  } as Record<PresetToken, TokenConfig>,
  webb: {
    WEBB: {
      chain: 'webb',
      name: 'WEBB',
      symbol: 'WEBB',
      precision: 18
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

  constructor(config: TokenConfig) {
    this.name = config.name;
    this.symbol = config.symbol || config.name;
    this.precision = config.precision || 18;
    this.chain = config.chain || 'edgeware';

    if (config.amount) {
      if (config.amount instanceof FixedPointNumber) {
        this.amount = config.amount;
      } else {
        this.amount = new TokenAmount(config.amount || 0, this.precision);
      }
    }
  }

  /**
   * @name isEqual
   * @description check if `token` equal current
   */
  public isEqual(token: Token): boolean {
    return this.chain === token.chain && this.name === token.name;
  }

  public toString(): string {
    return this.name;
  }

  public toChainData(): { Token: string } | string {
    if (this.chain === 'edgeware') {
      return { Token: this.name };
    }

    return this.name;
  }

  public clone(newConfig?: Partial<TokenConfig>): Token {
    return new Token({
      name: newConfig?.name || this.name || '',
      chain: newConfig?.chain || this.chain || '',
      precision: newConfig?.precision || this.precision || 0,
      amount: newConfig?.amount || this.amount || new FixedPointNumber(0),
      symbol: newConfig?.symbol || this.symbol || ''
    });
  }
}

function convert(config: Record<CHAIN, Record<string, TokenConfig>>): Record<CHAIN, Record<string, Token>> {
  return Object.keys(config).reduce((prev, chain) => {
    prev[chain as CHAIN] = Object.keys(config[chain as CHAIN]).reduce((prev, name) => {
      prev[name] = new Token(config[chain as CHAIN][name]);

      return prev;
    }, {} as Record<string, Token>);

    return prev;
  }, {} as Record<CHAIN, Record<string, Token>>);
}

export const PRESET_TOKENS = convert(presetTokensConfig);

export function getPresetToken(name: PresetToken, chain: CHAIN = 'edgeware'): Token {
  return PRESET_TOKENS[chain][name];
}

const TOKEN_SORT: Record<string, number> = {
  EDG: 0,
  WEBB: 0
};

const Tokens: Array<PresetToken> = ['EDG', 'WEBB'];

export function sortTokens(token1: Token, token2: Token, ...other: Token[]): Token[] {
  const result = [token1, token2, ...other];

  return result.sort((a, b) => TOKEN_SORT[a.name] - TOKEN_SORT[b.name]);
}

export function token2CurrencyId(api: ApiPromise | ApiRx, token: Token): CurrencyId {
  return api.createType('CurrencyId', token.toChainData());
}

export function currencyId2Token(token: CurrencyId): Token {
  return getPresetToken(Tokens[token.toNumber()] as PresetToken);
}
