const base = require('@polkadot/dev/config/eslint.cjs');

module.exports = {
  ...base,
  plugins:[
    ...base.plugins,
    "eslint-plugin-tsdoc",
    "prettier"
  ],
  ignorePatterns: [
    '.eslintrc.cjs',
    '.eslintrc.js',
    'babel-config-esm.cjs',
    'babel-config-cjs.cjs',
    'loader.js',
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
    'prettier/prettier': "error",
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
    '@typescript-eslint/no-misused-promises': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/restrict-plus-operands': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    "@typescript-eslint/require-await": 0,
    "@typescript-eslint/no-var-requires": 0,
    "tsdoc/syntax":"error"
  }
};
