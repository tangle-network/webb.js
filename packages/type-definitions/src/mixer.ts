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
    Nullifier: 'Data',
    Commitment: 'Data',
    GroupId: 'u32',
    GroupTree: {
      manager: 'AccountId',
      manager_required: 'bool',
      leaf_count: 'u32',
      max_leaves: 'u32',
      root_hash: 'Data',
      edge_nodes: 'Vec<Data>'
    },
    MixerInfo: {
      minimum_deposit_length_for_reward: 'BlockNumber',
      fixed_deposit_size: 'Balance',
      leaves: 'Vec<Data>'
    }
  }
};
