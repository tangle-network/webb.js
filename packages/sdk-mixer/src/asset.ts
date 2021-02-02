import type { TokenSymbol } from '@webb-tools/sdk-mixer';

export class Asset {
  constructor(public readonly id: number, public readonly tokenSymbol: TokenSymbol) {}
}

export class MixerAssetGroup {
  constructor(
    public readonly gid: number,
    public readonly tokenSymbol: TokenSymbol,
    public readonly treeDepth: number
  ) {}
}
