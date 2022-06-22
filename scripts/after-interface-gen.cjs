const fs = require('fs')
const path = require('path');

async function fixLookup(){
  try {
    const lookupfile = path.join(
      process.cwd(),
      'packages/types/src/interfaces/types-lookup.ts'
    );
    const data = fs.readFileSync(lookupfile).toString();
    const updatedContent = data.replace(`declare module '@polkadot/types/lookup'` , `// @ts-nocheck\ndeclare module '@polkadot/types/lookup'`)
    fs.writeFileSync(lookupfile,updatedContent)
  }catch (e) {
    console.log(e);
  }

}

fixLookup()
