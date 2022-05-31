// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.

import { Definitions } from '@polkadot/types/types';

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
  },
  types: {}
} as Definitions;
