const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = function (config = { isNode: 'false' }) {
  const isNode = config.isNode === 'true';
  if (isNode) {
    console.info('Building for nodjes');
  } else {
    console.info('Building for browser');
  }
  const build = path.join(__dirname, 'build', isNode ? 'node' : '');
  try {
    console.log(`Root files `, fs.readdirSync(__dirname), 'build');
  } catch (_) {
    console.log();
  }

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
        extraArgs: isNode ? `${args} --target nodejs` : args,
        crateDirectory: __dirname,
        outDir: build,
        outName: 'wasm-utils'
      })
    ]
  };
};
