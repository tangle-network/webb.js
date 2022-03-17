const base = require('@polkadot/dev/config/eslint.cjs');

module.exports = {
  ...base,
  ignorePatterns: [
    '.eslintrc.cjs',
    '.eslintrc.js',
    '.github/**',
    '.vscode/**',
    '.yarn/**',
    '**/build/*',
    '**/coverage/*',
    '**/node_modules/*',
    'scripts/**'
  ],
  parserOptions: {
    ...base.parserOptions,
    project: ['./tsconfig.json']
  },
  rules: {
    ...base.rules,
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 0,
    'header/header': [2, 'line', [
      { pattern: ' Copyright 2022 @webb-tools/' },
      ' SPDX-License-Identifier: Apache-2.0'
    ], 2],
    'no-useless-constructor': 0,
  }
};
