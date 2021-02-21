const config = require('@open-web3/dev-config/config/jest.cjs');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
    '@webb-tools/api(.*)$': '<rootDir>/packages/api/src/$1',
    '@webb-tools/types(.*)$': '<rootDir>/packages/types/src/$1',
    '@webb-tools/type-definitions(.*)$': '<rootDir>/packages/type-definitions/src/$1',
    '@webb-tools/sdk-core(.*)$': '<rootDir>/packages/sdk-core/src/$1',
    '@webb-tools/sdk-merkle(.*)$': '<rootDir>/packages/sdk-merkle/src/$1',
    '@webb-tools/sdk-mixer(.*)$': '<rootDir>/packages/sdk-mixer/src/$1'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/build',
    '<rootDir>/packages/api/build',
    '<rootDir>/packages/types/build',
    '<rootDir>/packages/type-definitions/build',
    '<rootDir>/packages/sdk-core/build',
    '<rootDir>/packages/sdk-merkle/build',
    '<rootDir>/packages/sdk-mixer/build'
  ],
  transform: {}
});
