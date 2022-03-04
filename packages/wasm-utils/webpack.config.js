const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = function () {
  const nodeBuild = path.join(__dirname, 'build', 'njs');
  const build = path.join(__dirname, 'build');

  try {
    console.log(`Pre build dir`, fs.readdirSync(path.join(__dirname, 'build')));
  } catch (_) {}

  const args = '--scope webb-tools';
  return {
    mode: 'production',
    entry: {
      utils: './js/utils.js'
    },
    output: {
      path: build,
      filename: '[name].js'
    },
    devServer: {
      contentBase: build
    },
    plugins: [
      new CopyPlugin([path.resolve(__dirname, 'public'), path.resolve(__dirname, 'package.json')]),
      new WasmPackPlugin({
        extraArgs: `${args} --target browser`,
        crateDirectory: __dirname,
        outDir: build,
        outName: 'wasm-utils'
      }),
      new WasmPackPlugin({
        extraArgs: `${args} --target nodejs`,
        crateDirectory: __dirname,
        outDir: nodeBuild,
        outName: 'wasm-utils'
      })
    ]
  };
};
