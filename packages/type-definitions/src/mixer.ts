export default {
  rpc: {},
  types: {
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
