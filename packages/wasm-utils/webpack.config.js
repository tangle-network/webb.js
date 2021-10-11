const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

const build = path.resolve(__dirname, 'build');
module.exports = {
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
      extraArgs: '--scope webb-tools',
      crateDirectory: __dirname,
      outDir: build,
      outName: 'wasm-utils'
    })
  ]
};
