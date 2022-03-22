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

const CONFIGS = ['babel.config.js', 'babel.config.cjs'];
const CPX = ['css', 'gif', 'hbs', 'jpg', 'js', 'json', 'png', 'svg', 'd.ts']
  .map((ext) => `src/**/*.${ext}`)
  .concat('package.json');

console.log('$ polkadot-dev-build-ts', process.argv.slice(2).join(' '));

function buildWebpack() {
  executeSync('yarn polkadot-exec-webpack --config webpack.config.js --mode production');
}

function buildWasmPack() {
  executeSync('yarn build');
}

async function buildBabel(dir) {
  // Get Root Configs
  const configs = CONFIGS.map((c) => path.join(process.cwd(), `../../${c}`));
  const babelConfig = configs.find((f) => fs.existsSync(f)) || configs[0];
  // Get local configs
  const localConfigs = CONFIGS.map((c) => path.join(process.cwd(), c));
  const localBabelConfig = localConfigs.find((f) => fs.existsSync(f));
  // Prefer to use local config over the root one.
  const conf = localBabelConfig || babelConfig;

  await babel({
    babelOptions: {
      configFile: conf
    },
    cliOptions: {
      extensions: ['.ts', '.tsx'],
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

    // if (!name.startsWith('@polkadot/')) {
    //   return;
    // }

    console.log(`*** ${name} ${version}`);

    mkdirp.sync('build');

    if (fs.existsSync(path.join(process.cwd(), 'public'))) {
      // buildWebpack(dir);
      // buildWasmPack(dir)
    } else {
      await buildBabel(dir);
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
