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
    // disable some rules brought in by polkadot/dev
    'no-useless-constructor': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-argument': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/restrict-template-expressions': 0,
    '@typescript-eslint/unbound-method': 0,
    '@typescript-eslint/await-thenable': 0,
    '@typescript-eslint/no-misused-promises': 0
  }
};
