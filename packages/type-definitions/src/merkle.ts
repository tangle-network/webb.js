export default {
  rpc: {
    mt: {
      treeLeaves: {
        description: 'Query for the tree leaves',
        params: [
          {
            name: 'tree_id',
            type: 'u32',
            isOptional: false
          },
          {
            name: 'from',
            type: 'u32',
            isOptional: false
          },
          {
            name: 'to',
            type: 'u32',
            isOptional: false
          },
          {
            name: 'at',
            type: 'Hash',
            isOptional: true
          }
        ],
        type: 'Vec<[u8; 32]>'
      }
    }
  },
  types: {
    TreeId: 'u32',
    KeyId: 'u32'
  },
  typesAlias: {}
};
