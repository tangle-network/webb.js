// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

export default {
  rpc: {
    getLeaves: {
      description: 'Query for the tree leaves',
      params: [
        {
          isOptional: false,
          name: 'tree_id',
          type: 'u32'
        },
        {
          isOptional: false,
          name: 'from',
          type: 'u32'
        },
        {
          isOptional: false,
          name: 'to',
          type: 'u32'
        },
        {
          isOptional: true,
          name: 'at',
          type: 'Hash'
        }
      ],
      type: 'Vec<[u8; 32]>'
    }
  }
};
