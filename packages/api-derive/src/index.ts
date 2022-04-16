// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';

export const getAnchors = async (api: ApiPromise): Promise<any[]> => {
  await api.query.anchorBn254.anchors.entries();

  return [];
};
