export async function main() {
  const wasm = await import('@webb-tools/wasm-utils');
  console.log(wasm.DepositNote);
}
main();
