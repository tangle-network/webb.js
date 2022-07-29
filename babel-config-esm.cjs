const polkadotBabelConfig = require('@polkadot/dev/config/babel-config-esm.cjs');

module.exports = {
  plugins: [
    ...polkadotBabelConfig.plugins,
  ],
  presets: [
    ...polkadotBabelConfig.presets
  ]
};
