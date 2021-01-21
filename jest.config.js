const config = require('@open-web3/dev-config/config/jest.cjs');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
    '@webb-tools/api(.*)$': '<rootDir>/packages/api/src/$1',
    '@webb-tools/types(.*)$': '<rootDir>/packages/types/src/$1',
    '@webb-tools/type-definitions(.*)$': '<rootDir>/packages/type-definitions/src/$1'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/build',
    '<rootDir>/packages/api/build',
    '<rootDir>/packages/types/build',
    '<rootDir>/packages/type-definitions/build'
  ]
});
