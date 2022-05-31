// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

// augmentDerives.ts
import type { Observable } from 'rxjs';

declare module '@polkadot/api-derive/derive' {
  // extend, add our custom section
  // https://github.com/polkadot-js/api/pull/4578
  export interface ExactDerive {
    merkleTreeBn254: {
      getLeafCountForTree: ReturnType<() => (treeId: number) => Observable<number>>;
      // api for pagination support
      getLeavesForTree: ReturnType<() => (treeId: number, start: number, end: number) => Observable<Uint8Array[]>>;
    };
  }
}
