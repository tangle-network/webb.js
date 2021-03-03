const baseConfig = require('./jest.config.js');
module.exports = {
  ...baseConfig,
  cacheDirectory: './node_modules/.jestCachePerf',
  testMatch: ['**/__perf__/**/*.perf.[jt]s?(x)', '**/?(*.)+(spec|test).perf.[jt]s?(x)'],
  transformIgnorePatterns: ['node_modules/(?!(@webb-tools/mixer-client)/)'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-performance']
};
