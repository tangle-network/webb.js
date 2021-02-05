import { hexToU8a, u8aToHex } from '@polkadot/util';
import { WebbNotePrefix, TokenSymbol, Asset } from '@webb-tools/sdk-mixer';

export class Note {
  // Default constructor
  private constructor(
    public readonly prefix: WebbNotePrefix,
    public readonly version: string,
    public readonly tokenSymbol: TokenSymbol,
    public readonly id: number,
    // can be set later after the TX.
    public blockNumber: number | null,
    public readonly rAndNullifier: Uint8Array
  ) {}

  public static deserialize(value: string): Note {
    const parts = value.split('-');
    const withBlockNumber = parts.length === 6;
    let i = -1;
    const prefix = parts[++i] as WebbNotePrefix; // 0
    const version = parts[++i]; // 1
    const tokenSymbol = parts[++i] as TokenSymbol; // 2
    const id = parseInt(parts[++i]); // 3
    let blockNumber = null;
    if (withBlockNumber) {
      blockNumber = parseInt(parts[++i]); // 4?
    }
    const rAndNullifier = hexToU8a('0x' + parts[++i]); // 4-5
    // assign values here after parsing it.
    return new Note(prefix, version, tokenSymbol, id, blockNumber, rAndNullifier);
  }

  public serialize(): string {
    const parts: string[] = [];
    parts.push(this.prefix);
    parts.push(this.version);
    parts.push(this.tokenSymbol);
    parts.push(this.id.toString());
    if (this.blockNumber !== null) {
      parts.push(this.blockNumber.toString());
    }
    parts.push(u8aToHex(this.rAndNullifier, -1, false));

    const final = parts.join('-');
    return final;
  }

  public asAsset(): Asset {
    return new Asset(this.id, this.tokenSymbol);
  }
}
