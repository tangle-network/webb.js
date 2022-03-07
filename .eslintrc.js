const base = require('@open-web3/dev-config/config/eslint.cjs');

module.exports = {
  ...base,
  parser: '@typescript-eslint/parser',
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    '.eslintrc.cjs',
    '.eslintrc.js',
    'babel.config.js',
    '.github/**',
    '.vscode/**',
    '.yarn/**',
    '**/build/*',
    '**/coverage/*',
    '**/node_modules/*'
  ],
  parserOptions: {
    ...base.parserOptions,
    project: ['./tsconfig.json']
  },
  rules: {
    ...base.rules,
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 0,
  }
};
