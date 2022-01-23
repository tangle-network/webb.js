const { execSync } = require('child_process');
const fs = require('fs');
const { join } = require('path');
async function main() {
  // build  for nodejs
  execSync('yarn build:node');

  const rootPath = join(__dirname, '..');
  // copy files outside /build
  const source = fs.createReadStream(join(rootPath, 'build'));
  fs.mkdirSync(join(rootPath, 'temp-build'));
  const dist = fs.createWriteStream(join(rootPath, 'temp-build'));

  source.pipe(dist);
  await new Promise((resolve, reject) => {
    source.on('end', resolve);
    source.on('error', reject);
  });

  // build for browser
  execSync('yarn build:browser');

  // copy from temp-build to /build/node
  fs.mkdirSync(join(rootPath, 'build', 'node'));
  const nodeDist = fs.createWriteStream(join(rootPath, 'build', 'node'));
  const tempSource = fs.createReadStream(join(rootPath, 'temp-build'));

  tempSource.pipe(nodeDist);
  await new Promise((resolve, reject) => {
    tempSource.on('end', resolve);
    tempSource.on('error', reject);
  });

  fs.unlinkSync(join(rootPath, 'temp-build'));
}
main().then(() => console.log('Done building'));
