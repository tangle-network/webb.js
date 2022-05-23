// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { DepositPayload, MixerDeposit, MixerSize } from '../mixer/mixer-deposit.js';
import { WebbApiProvider } from '../webb-provider.interface.js';

export type AnchorSize = MixerSize;

// Todo: should we extract the interface of MixerDeposit on another class and rename `generateBridgeNote` to generate note

/**
 * Anchor deposit abstract interface as fixed anchor share similar functionality as the mixer
 * The interface looks the same but there's a different function for note Generation
 **/
export abstract class AnchorDeposit<
  T extends WebbApiProvider<any>,
  K extends DepositPayload = DepositPayload<any>
> extends MixerDeposit<T, K> {
  generateNote(anchorId: number | string): Promise<K> {
    throw new Error('api not ready:Not mixer api for ' + anchorId);
  }

  abstract generateBridgeNote(
    anchorId: number | string,
    destination: number,
    wrappableAssetAddress?: string
  ): Promise<K>;
}
