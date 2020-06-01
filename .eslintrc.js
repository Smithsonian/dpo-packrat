module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        browser: true,
        node: true,
    },
    plugins: ['react', '@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended'],
    rules: {
        quotes: ['error', 'single'],
        camelcase: 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    },
};
