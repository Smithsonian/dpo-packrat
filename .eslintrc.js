module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    env: {
        browser: true,
        node: true,
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        camelcase: 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    },
};
