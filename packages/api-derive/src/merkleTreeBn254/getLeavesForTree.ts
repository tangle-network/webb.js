// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

// Get leaves for mixer function returns a function for getting the leaves for a tree in an interval.
// The resulting function requires the user to pass the starting leafIndex for the queryable leaves.
import { map } from 'rxjs';

import { ApiInterfaceRx } from '@polkadot/api/types';
import { memo } from '@polkadot/rpc-core';
import { Observable } from '@polkadot/types/types';

/**
 * An optional `end` parameter is provided to allow for pagination.
 */
export function getLeavesForTree (
  instanceId: string,
  api: ApiInterfaceRx
): (treeId: number, startIndex: number, endIndex: number) => Observable<Uint8Array[]> {
  return memo(instanceId, (treeId: number, start: number, end: number) => {
    // get an array of numbers from start to end.
    const arr = [...Array(end - start + 1).keys()].map((x) => x + start);
    /* eslint-disable */
    return api.query.merkleTreeBn254.leaves
      .multi([
        // Generate arrays for the multi calls of [treeId, index]
        ...arr.map((index) => {
          return [treeId, index];
        })
      ])
      .pipe(
        map((substrateLeafElement) => {
          return substrateLeafElement.map((element) => {
            return element.toU8a();
          });
        })
      );
  });
}
