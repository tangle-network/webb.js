const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const babel = require('@open-web3/dev-config/config/babel-config-esm.cjs');

module.exports = {
  entry: './main.ts',
  mode: 'development',
  output: {
    path: path.join(__dirname, '.', 'build'),
    filename: 'entry-input.js',
    library: 'entryInput',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.ts'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.join(__dirname, '..', '..', 'tsconfig.json')
      })
    ]
  },
  devServer: {},
  stats: 'errors-only',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.t?sx?$/,
        use: [
          {
            loader: 'ts-loader'
          },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false,
              ...babel
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.join(__dirname, '..', '..', 'tsconfig.json')
      }
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html')
    })
  ]
};
