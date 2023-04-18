const polkadotBabelConfig = require('./polkadot-dev-configs/babel-config-esm.cjs');

module.exports = {
  plugins: [
    ...polkadotBabelConfig.plugins,
  ],
  presets: [
    ...polkadotBabelConfig.presets
  ]
};
