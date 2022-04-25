#!/usr/bin/env node
// Copyright 2017-2020 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

const babel = require('@babel/cli/lib/babel/dir').default;
const path = require('path');
const mkdirp = require('mkdirp');
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

const CPX = ['css', 'gif', 'hbs', 'jpg', 'js', 'json', 'png', 'svg', 'd.ts']
  .map((ext) => `src/**/*.${ext}`)
  .concat('package.json');


function buildWebpack() {
  executeSync('yarn polkadot-exec-webpack --config webpack.config.cjs --mode production');
}

// @param module - the module system to use cjs or esm.
async function buildBabel(dir, module = 'esm') {
  console.log('build babel for: ', module);

  // babel configuratiom
  const configFileName = `babel-config-${module}.cjs`;

  // Get Config Options:
  const rootConfig = path.join(process.cwd(), `../../${configFileName}`);
  const potentialLocalConfig = path.join(process.cwd(), configFileName);

  // Prefer to use local config over the root one.
  const conf = fs.existsSync(potentialLocalConfig) ? potentialLocalConfig : rootConfig;

  await babel({
    babelOptions: {
      configFile: conf
    },
    cliOptions: {
      extensions: ['.ts'],
      filenames: ['src'],
      ignore: '**/*.d.ts',
      outDir: path.join(process.cwd(), 'build'),
      outFileExtension: '.js'
    }
  });

  [...CPX]
    .concat(`../../build/${dir}/src/**/*.d.ts`, `../../build/packages/${dir}/src/**/*.d.ts`)
    .forEach((src) => copySync(src, 'build'));
}

async function buildJs(dir) {
  if (!fs.existsSync(path.join(process.cwd(), '.skip-build'))) {
    const { name, version } = require(path.join(process.cwd(), './package.json'));

    console.log(`*** ${name} ${version}`);

    mkdirp.sync('build');

    if (fs.existsSync(path.join(process.cwd(), 'public'))) {
      buildWebpack(dir);
    } else {
      if (dir === 'types') {
        await buildBabel(dir, 'cjs');
      } else {
        await buildBabel(dir, 'esm');
      }
    }

    console.log();
  }
}

async function buildMonorepo() {
  executeSync('yarn polkadot-dev-clean-build');
  const cw = process.cwd();
  const packages = path.join(cw, 'packages', 'wasm-utils');
  executeSync(`cd ` + packages + ' && yarn build');

  process.chdir('packages');

  executeSync('tsc --emitDeclarationOnly --outdir ../build');

  const dirs = fs
    .readdirSync('.')
    .filter((dir) => fs.statSync(dir).isDirectory() && fs.existsSync(path.join(process.cwd(), dir, 'src')));

  for (const dir of dirs) {
    process.chdir(dir);

    await buildJs(dir);

    process.chdir('..');
  }

  process.chdir('..');
}

async function buildPolyrepo() {
  executeSync('yarn polkadot-exec-tsc --outdir ./build');

  [...CPX].forEach((src) => copySync(src, './build'));
}

async function main() {
  if (!fs.existsSync(path.join(process.cwd(), 'packages'))) {
    buildPolyrepo();
  } else {
    buildMonorepo();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
