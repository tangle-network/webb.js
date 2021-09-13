const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const babel = require('@open-web3/dev-config/config/babel-config-esm.cjs');

function buildSDKsAliases() {
  const alias = {};
  const packages = path.join(__dirname, '../..', 'packages');
  const files = fs.readdirSync(packages);
  files.forEach((file) => {
    alias[`@webb-tools/${file}`] = path.join(packages, file, 'build');
  });
  return alias;
}

console.log(buildSDKsAliases());
module.exports = {
  entry: './src/main.ts',
  mode: 'development',
  output: {
    path: path.join(__dirname, '.', 'build'),
    publicPath: '/',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [new TsconfigPathsPlugin()],
    alias: {
      ...buildSDKsAliases()
    }
  },
  devServer: {},
  stats: 'errors-only',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false
            }
          }
        ]
      },
      {
        test: /.worker.(ts|js)?$/,
        loader: 'worker-loader'
      }
    ]
  },
  plugins: [
    // new ForkTsCheckerWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html')
    })
  ]
};
