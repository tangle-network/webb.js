import type { TokenSymbol } from '@webb-tools/sdk-mixer';

export class Asset {
  constructor(public readonly id: number, public readonly tokenSymbol: TokenSymbol) {}
}

export class MixerAssetGroup {
  constructor(
    /** The group id for pallet merkle group / merkle tree */
    public readonly gid: number,
    public readonly tokenSymbol: TokenSymbol,
    public readonly treeDepth: number
  ) {}
}
