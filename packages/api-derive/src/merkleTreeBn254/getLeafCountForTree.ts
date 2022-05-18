// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { map, Observable } from 'rxjs';

import { ApiInterfaceRx } from '@polkadot/api/types';
import { memo } from '@polkadot/rpc-core';

export function getLeafCountForTree (
  instanceId: string,
  api: ApiInterfaceRx
): (treeId: number) => Observable<number> {
  return memo(instanceId, (treeId: number) => {
    return api.query.merkleTreeBn254.nextLeafIndex(treeId).pipe(
      map((value) => Number(value.toHex()))
    );
  });
}
