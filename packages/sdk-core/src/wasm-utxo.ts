import type { Backend, Curve, JsUtxo } from '@webb-tools/wasm-utils';

export class WasmUtxo {
  constructor (readonly inner: JsUtxo) {
  }

  private static get wasm () {
    if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
      // If node is running in an esm context, return esm compliant package.
      return import('@webb-tools/wasm-utils/njs/wasm-utils-njs.js');
    } else {
      return import('@webb-tools/wasm-utils/wasm-utils.js');
    }
  }

  serialize (): string {
    return this.inner.serialize();
  }

  static async deserialize (utxoString: string): Promise<WasmUtxo> {
    const wasm = await WasmUtxo.wasm;
    const utxo = wasm.JsUtxo.deserialize(utxoString);

    return new WasmUtxo(utxo);
  }

  static async new (
    curve: Curve,
    backend: Backend,
    inputSize: number,
    outputSize: number,
    amount: string,
    chainId: string,
    index?: string,
    privateKey?: Uint8Array,
    blinding?: Uint8Array
  ) {
    const wasm = await WasmUtxo.wasm;

    return new wasm.JsUtxo(curve, backend, inputSize, outputSize, amount, chainId, index, privateKey, blinding);
  }

  get amount (): string {
    return this.inner.amount;
  }

  get amountRaw (): string {
    return this.inner.amountRaw;
  }

  get blinding (): string {
    return this.inner.blinding;
  }

  get chainIdBytes (): string {
    return this.inner.chainIdBytes;
  }

  get chainIdRaw (): string {
    return this.inner.chainIdRaw.toString();
  }

  get commitment (): Uint8Array {
    return this.inner.commitment;
  }

  get index (): any {
    return this.inner.index;
  }

  get nullifier (): string {
    return this.inner.nullifier;
  }

  get secret_key (): string {
    return this.inner.secret_key;
  }
}
