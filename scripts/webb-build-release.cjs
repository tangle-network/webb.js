#!/usr/bin/env node
// Copyright 2017-2020 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const { execSync: _execSync } = require('child_process');

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

const execSync = (cmd) => _execSync(cmd, { stdio: 'inherit' });

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
  execSync('yarn polkadot-dev-clean-build');
}

function runCheck() {
  execSync('yarn lint');
}

function runBuild() {
  execSync('yarn build');
}

function runTest() {
  execSync('git submodule update --init --recursive')
  execSync('yarn test');
}


function npmGetVersion() {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')).version;
}

function npmSetup() {
  const registry = 'registry.npmjs.org';

  fs.writeFileSync(path.join(os.homedir(), '.npmrc'), `//${registry}/:_authToken=${process.env.NPM_TOKEN}`);
}

function npmPublish() {
  if (fs.existsSync('.skip-npm')) {
    return;
  }

  // Before publishing, copy the package.json with updated versions from the root
  // package folder and into the root of the published ('build') folder
  rimraf.sync('build/package.json');

  // take the package.json defined in the module and strip out the '/build/'
  // in the export paths before copying to the output 'build' folder for publishing.
  // The 'build/' in the path exists for packages to resolve properly while using
  // webb.js locally.
  //    e.g. the '@webb-tools/test-utils' package needs this to properly resolve
  //         methods in '@webb-tools/sdk-core' because it imports '@webb-tools/utils'
  //         which uses '@webb-tools/sdk-core' in its dependencies. 
  const raw = fs.readFileSync('./package.json');
  const pkg = JSON.parse(raw);
  const pkgString = JSON.stringify(pkg);
  const newPkgString = pkgString.replaceAll('/build/', '/');

  ['LICENSE', 'README.md'].forEach((file) => copySync(file, 'build'));
  fs.writeFileSync('./build/package.json', newPkgString);
  console.log('args', process.argv);

  process.chdir('build');

  const tag = npmGetVersion().includes('-') ? '--tag beta' : '';
  let count = 1;

  while (true) {
    try {
      execSync(`npm publish --access public ${tag}`);

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

function gitSetup() {
  execSync('git config push.default simple');
  execSync('git config merge.ours.driver true');
  execSync('git config user.name "Github Actions"');
  execSync('git config user.email "action@github.com"');
  execSync('git checkout master');
}

function gitBump() {
  const currentVersion = npmGetVersion();
  const [version, tag] = currentVersion.split('-');
  const [,, patch] = version.split('.');

  if (tag) {
    // if we have a beta version, just continue the stream of betas
    execSync(`${path.join(__dirname, 'update-version.cjs')} prerelease`);
  } else if (argv['skip-beta']) {
    // don't allow beta versions
    execSync(`${path.join(__dirname, 'update-version.cjs')} patch`);
  } else if (patch === '0') {
    // patch is .0, so publish this as an actual release (surely we did our job on beta)
    execSync(`${path.join(__dirname, 'update-version.cjs')} patch`);
  } else if (patch === '1') {
    // continue with first new minor as beta
    execSync(`${path.join(__dirname, 'update-version.cjs')} prerelease`);
  } else {
    // manual setting of version, make some changes so we can commit
    fs.appendFileSync(path.join(process.cwd(), '.123trigger'), currentVersion);
  }

  execSync('git add --all .');
}

function gitPush() {
  const version = npmGetVersion();
  const doGHRelease = false;

  // if (process.env.GH_RELEASE_GITHUB_API_TOKEN) {
  //   const changes = fs.readFileSync('CHANGELOG.md', 'utf8');

  //   if (changes.includes(`## ${version}`)) {
  //     doGHRelease = true;
  //   } else if (version.endsWith('.1')) {
  //     throw new Error(`Unable to release, no CHANGELOG entry for ${version}`);
  //   }
  // }

  execSync('git add --all .');

  if (fs.existsSync('docs/README.md')) {
    execSync('git add --all -f docs');
  }

  // add the skip checks for GitHub ...
  execSync(`git commit --no-status --quiet -m "[CI Skip] release/${version.includes('-') ? 'beta' : 'stable'} ${version} skip-checks: true"`);

  execSync(`git push ${repo} HEAD:${process.env.GITHUB_REF}`, true);

  if (doGHRelease) {
    const files = process.env.GH_RELEASE_FILES ? `--assets ${process.env.GH_RELEASE_FILES}` : '';

    execSync(`yarn polkadot-exec-ghrelease --draft ${files} --yes`);
  }
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

gitSetup();
gitBump();
npmSetup();

runClean();
runCheck();
runBuild();
runTest();

gitPush();
// TODO: Investigate generate-docs not working on CI
//execSync("node ./generate-docs")
loopFunc(npmPublish);
