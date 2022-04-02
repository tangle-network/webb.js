// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

// import WasmPackPlugin from '@wasm-tool/wasm-pack-plugin';
// import CopyPlugin from 'copy-webpack-plugin';
// import fs from 'fs';
// import path from 'path';
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
