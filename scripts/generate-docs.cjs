const {execSync} =require("child_process")

const packages = [
  "api",
  "sdk-core",
  "types"
]

function getTypeDocCMD(packageName){
  return `npx typedoc ./packages/${packageName}/src/index.ts --out ./doc/${packageName} `
}

for (const packageName of packages){
  try{
    execSync(getTypeDocCMD(packageName));

  }catch (e){
    console.log(`Failed to generate docs for package ${packageName}`,e);
  }
}
try {
  execSync(`npx typedoc ./packages/wasm-utils/build/wasm-utils.d.ts --out ./doc/wasm-utils`)
}catch (e) {
  console.log(`Failed to generate docs for package wasm-utils`,e);
}
