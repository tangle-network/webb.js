const plugins = require('@polkadot/dev/config/babel-plugins.cjs');
const presets = require('@polkadot/dev/config/babel-presets.cjs');

module.exports = {
  assumptions: {
    privateFieldsAsProperties: true,
    setPublicClassFields: true
  },
  presets: presets(false),
  plugins: plugins(false, false),
  babelrcRoots: ['.', 'packages/*']
};
