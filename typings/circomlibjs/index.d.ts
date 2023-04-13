declare module 'circomlibjs' {
  export function poseidon(inputs: any[]): bigint;
  export namespace poseidon_gencontract {
    function createCode(nInputs: any): any

    function generateABI(nInputs: any): any
  }
}
