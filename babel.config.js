const base = require('@open-web3/dev-config/config/babel-config-cjs.cjs');

module.exports = {
  ...base,
  babelrcRoots: ['.', 'packages/*']
};
