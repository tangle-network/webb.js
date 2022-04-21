const polkadotBabelConfig = require('@polkadot/dev/config/babel-config-cjs.cjs');

module.exports = {
  plugins: [
    ...polkadotBabelConfig.plugins,
    '@babel/plugin-syntax-import-assertions'
  ],
  presets: [
    ...polkadotBabelConfig.presets
  ]
};
