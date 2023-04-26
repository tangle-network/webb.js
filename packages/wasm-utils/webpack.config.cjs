// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0

const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = function () {
  const nodeBuild = path.join(__dirname, 'build', 'njs');
  const build = path.join(__dirname, 'build');

  try {
    console.log('Pre build dir', fs.readdirSync(path.join(__dirname, 'build')));
  } catch (_) {}

  const args = '--scope webb-tools';

  return {
    devServer: {
      contentBase: build
    },
    entry: {
      utils: './js/utils.js'
    },
    mode: 'production',
    output: {
      filename: '[name].js',
      path: build
    },
    plugins: [
      new CopyPlugin([path.resolve(__dirname, 'public'), path.resolve(__dirname, 'package.json')]),
      new WasmPackPlugin({
        crateDirectory: __dirname,
        extraArgs: `${args} --target browser`,
        outDir: build,
        outName: 'wasm-utils'
      }),
      new WasmPackPlugin({
        crateDirectory: __dirname,
        extraArgs: `${args} --target nodejs`,
        outDir: nodeBuild,
        outName: 'wasm-utils-njs'
      })
    ]
  };
};
