const config = require('@open-web3/dev-config/config/jest.cjs');

const buildDirs = [
  '<rootDir>/build',
  '<rootDir>/packages/api/build',
  '<rootDir>/packages/app-util/build',
  '<rootDir>/packages/types/build',
  '<rootDir>/packages/type-definitions/build',
  '<rootDir>/packages/sdk-core/build',
  '<rootDir>/packages/wasm-utils/build',
];

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
    '@webb-tools/api(.*)$': '<rootDir>/packages/api/src/$1',
    '@webb-tools/app-util(.*)$': '<rootDir>/packages/app-util/src/$1',
    '@webb-tools/types(.*)$': '<rootDir>/packages/types/src/$1',
    '@webb-tools/type-definitions(.*)$': '<rootDir>/packages/type-definitions/src/$1',
    '@webb-tools/sdk-core(.*)$': '<rootDir>/packages/sdk-core/src/$1',
    '@webb-tools/wasm-utils(.*)$': '<rootDir>/packages/wasm-utils/build/$1'
  },
  moduleDirectories: ['node_modules'],
  modulePathIgnorePatterns: [...buildDirs],
  testPathIgnorePatterns: [...buildDirs],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'ts-jest'
  }
});
