module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    camelcase: 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
  },
};
