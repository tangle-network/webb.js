// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0
import { DepositPayload, MixerDeposit, MixerSize } from '../mixer/mixer-deposit';
import { WebbApiProvider } from '../webb-provider.interface';

export type AnchorSize = MixerSize;

export abstract class AnchorDeposit<
  T extends WebbApiProvider<any>,
  K extends DepositPayload = DepositPayload<any>
> extends MixerDeposit<T, K> {
  generateNote (anchorId: number | string): Promise<K> {
    throw new Error('api not ready:Not mixer api for ' + anchorId);
  }

  abstract generateBridgeNote(
    anchorId: number | string,
    destination: number,
    wrappableAssetAddress?: string
  ): Promise<K>;
}
