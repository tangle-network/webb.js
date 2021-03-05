export default {
  rpc: {},
  types: {
    EvmAddress: 'H160',
    TokenSymbol: {
      _enum: ['EDG', 'HEDG', 'DOT', 'KSM']
    },
    CurrencyId: {
      _enum: {
        Token: 'TokenSymbol',
        DEXShare: '(TokenSymbol, TokenSymbol)',
        ERC20: 'EvmAddress'
      }
    },
    ScalarData: '[u8; 32]',
    Nullifier: 'ScalarData',
    Commitment: 'ScalarData',
    MixerInfo: {
      minimum_deposit_length_for_reward: 'BlockNumber',
      fixed_deposit_size: 'Balance',
      leaves: 'Vec<ScalarData>'
    }
  },
  typesAlias: {}
};
