module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    settings: {
        react: {
            version: '16.13'
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        }
    },
    env: {
        browser: true,
        node: true
    },
    plugins: ['react', '@typescript-eslint', 'prettier'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:import/errors', 'plugin:import/typescript'],
    rules: {
        // JS/TS RULES
        quotes: ['error', 'single'],
        camelcase: 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'import/newline-after-import': ['error', { count: 1 }],
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 1 }],
        'no-trailing-spaces': 'error',
        '@typescript-eslint/type-annotation-spacing': ['error'],
        'object-curly-spacing': ['error', 'always'],
        'key-spacing': ['error', { beforeColon: false, mode: 'minimum' }],
        'object-shorthand': ['error', 'always'],
        // JSX RULES
        'jsx-quotes': ['error', 'prefer-single'],
        'react/jsx-boolean-value': 'error',
        'react/jsx-closing-bracket-location': 'error',
        'react/jsx-equals-spacing': 'error',
        'react/jsx-indent-props': ['error', 4],
        'react/jsx-indent': ['error', 4],
        'react/jsx-max-props-per-line': ['error', { maximum: 4 }],
        'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
        'react/jsx-no-literals': 'off',
        'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always' }]
    }
};
