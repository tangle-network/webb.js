export default {
  rpc: {},
  types: {
    GroupId: 'u32',
    Manager: {
      accountId: 'AccountId',
      required: 'bool'
    },
    GroupTree: {
      leaf_count: 'u32',
      max_leaves: 'u32',
      depth: 'u8',
      root_hash: 'ScalarData',
      edge_nodes: 'Vec<ScalarData>'
    }
  },
  typesAlias: {}
};
