#!/usr/bin/env node
// Copyright 2017-2020 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const glob = require('glob');
const glob2base = require('glob2base');
const { Minimatch } = require('minimatch');

function normalizePath(originalPath) {
  const normalizedPath = path.relative(process.cwd(), path.resolve(originalPath)).replace(/\\/g, '/');

  return /\/$/.test(normalizedPath) ? normalizedPath.slice(0, -1) : normalizedPath || '.';
}

const copySync = (src, dst) => {
  const normalizedSource = normalizePath(src);
  const normalizedOutputDir = normalizePath(dst);
  const baseDir = normalizePath(glob2base({ minimatch: new Minimatch(normalizedSource) }));

  glob
    .sync(normalizedSource, {
      follow: false,
      nodir: true,
      silent: true
    })
    .forEach((src) => {
      const dst = baseDir === '.' ? path.join(normalizedOutputDir, src) : src.replace(baseDir, normalizedOutputDir);

      if (dst !== src) {
        const stat = fs.statSync(src);

        if (stat.isDirectory()) {
          fs.ensureDirSync(dst);
        } else {
          fs.ensureDirSync(path.dirname(dst));
          fs.copySync(src, dst);
        }

        fs.chmodSync(dst, stat.mode);
      }
    });
}
const executeSync = (cmd) => {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    process.exit(-1);
  }
}

const argv = require('yargs')
  .options({
    'skip-beta': {
      description: 'Do not increment as beta',
      type: 'boolean'
    }
  })
  .strict().argv;

const repo = `https://${process.env.GH_PAT}@github.com/${process.env.GITHUB_REPOSITORY}.git`;

console.log('$ polkadot-ci-ghact-build', process.argv.slice(2).join(' '));

function runClean() {
  executeSync('yarn polkadot-dev-clean-build');
}

function runCheck() {
  executeSync('yarn lint');
}

function runTest() {
  executeSync('yarn test');

  // if [ -f "coverage/lcov.info" ] && [ -n "$COVERALLS_REPO_TOKEN" ]; then
  //   console.log('*** Submitting to coveralls.io');

  //   (cat coverage/lcov.info | yarn run coveralls) || true
  // fi
}

function runBuild() {
  executeSync('yarn build');
}

function npmGetVersion() {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')).version;
}

function npmPublish() {
  if (fs.existsSync('.skip-npm')) {
    return;
  }

  rimraf.sync('build/package.json');
  ['LICENSE', 'README.md', 'package.json'].forEach((file) => copySync(file, 'build'));
  console.log('args', process.argv);

  process.chdir('build');

  const tag = npmGetVersion().includes('-') ? '--tag beta' : '';
  let count = 1;

  while (true) {
    try {
      executeSync(`npm publish --access public ${tag}`);

      break;
    } catch (error) {
      console.error(error);
      if (count < 5) {
        const end = Date.now() + 15000;

        console.error(`Publish failed on attempt ${count}/5. Retrying in 15s`);
        count++;

        while (Date.now() < end) {
          // just spin our wheels
        }
      }
    }
  }

  process.chdir('..');
}

function gitBump() {
  const currentVersion = npmGetVersion();
  const [version, tag] = currentVersion.split('-');
  const [,, patch] = version.split('.');
  console.log(`currentVersion ${currentVersion}  -<<>>-,version ${version}, tag ${tag}, patch ${patch}`);
  if (tag) {
    // if we have a beta version, just continue the stream of betas
    executeSync(`${path.join(__dirname, 'update-version.js')} prerelease`);
  } else if (argv['skip-beta']) {
    // don't allow beta versions
    executeSync(`${path.join(__dirname, 'update-version.js')} patch`);
  } else if (patch === '0') {
    // patch is .0, so publish this as an actual release (surely we did our job on beta)
    executeSync(`${path.join(__dirname, 'update-version.js')} patch`);
  } else if (patch === '1') {
    // continue with first new minor as beta
    executeSync(`${path.join(__dirname, 'update-version.js')} prerelease`);
  } else {
    // manual setting of version, make some changes so we can commit
    fs.appendFileSync(path.join(process.cwd(), '.123trigger'), currentVersion);
  }

  executeSync('git add --all .');
}

function loopFunc(fn) {
  if (fs.existsSync('packages')) {
    fs.readdirSync('packages')
      .filter((dir) => {
        const pkgDir = path.join(process.cwd(), 'packages', dir);

        return (
          fs.statSync(pkgDir).isDirectory() &&
          fs.existsSync(path.join(pkgDir, 'package.json')) &&
          fs.existsSync(path.join(pkgDir, 'build'))
        );
      })
      .forEach((dir) => {
        process.chdir(path.join('packages', dir));
        fn();
        process.chdir('../..');
      });
  } else {
    fn();
  }
}

gitBump();

runClean();
runCheck();
runTest();
runBuild();

// gitPush();
execSync("node ./generate-docs")
loopFunc(npmPublish);
