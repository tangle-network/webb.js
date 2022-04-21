// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// Get leaves for mixer function returns a function for getting the leaves for a tree in an interval.
// The resulting function requires the user to pass the starting leafIndex for the queryable leaves.

import { ApiInterfaceRx } from '@polkadot/api/types';
import { memo } from '@polkadot/rpc-core';
import { EggStandaloneRuntimeProtocolSubstrateConfigElement } from '@polkadot/types/lookup';
import { Observable } from '@polkadot/types/types';

// An optional `end` parameter is provided to allow for pagination, or defaults to the last index.
export function getLeavesForTree (
  instanceId: string,
  api: ApiInterfaceRx
): (treeId: number, start: number, end: number) => Observable<EggStandaloneRuntimeProtocolSubstrateConfigElement[]> {
  return memo(instanceId, (treeId: number, start: number, end: number) => {
    // get an array of numbers from start to end.
    const arr = [...Array(end - start + 1).keys()].map((x) => x + start);

    return api.query.merkleTreeBn254.leaves.multi([
      // Generate arrays for the multi calls of [treeId, index]
      ...arr.map((index) => {
        return [treeId, index];
      })
    ]);
  });
}
