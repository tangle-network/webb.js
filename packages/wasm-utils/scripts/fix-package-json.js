const path = require('path');
const fs = require('fs');
const buildDir = path.join(__dirname, '..', 'build');
console.info('Produce a hybrid package');
console.log('Reading original package json for root');
const originalPackageJsonPath = path.join(buildDir, 'package.json');
const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath).toString());
// Adding `node/` to the published files
const publishPackageJson = {
  ...originalPackageJson,
  files: [...originalPackageJson.files, ...originalPackageJson.files.map((i) => `node/${i}`)]
};
console.log('writing the updated package.json');
fs.writeFileSync(originalPackageJsonPath, JSON.stringify(publishPackageJson, null, 2));
console.info(`deleting  node extra files`);
fs.unlinkSync(path.join(buildDir, 'node', 'package.json'));
console.info('Done patching the package');
