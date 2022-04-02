const polkadotBabelConfig = require('@polkadot/dev/config/babel-config-esm.cjs');

module.exports = {
  plugins: [
    ...polkadotBabelConfig.plugins,
    '@babel/plugin-syntax-import-assertions'
  ],
  presets: [
    ...polkadotBabelConfig.presets
  ]
};
