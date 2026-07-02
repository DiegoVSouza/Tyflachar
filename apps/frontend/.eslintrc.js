// Self-contained config built from @typescript-eslint/*, eslint-plugin-react and
// eslint-plugin-react-hooks (all in devDependencies) — no eslint-config-react-app dependency.
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // React 17+ JSX transform — no need for `React` to be in scope
    'react/react-in-jsx-scope': 'off',

    // Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Geral
    'no-console': ['warn', { allow: ['warn', 'error', 'group', 'groupEnd', 'groupCollapsed'] }],

    // Desativa a regra base (não entende TypeScript) e usa a versão TS-aware
    // que ignora parâmetros de type aliases, interfaces e callbacks de tipo.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],

    'no-debugger': 'error',

    // React
    'react/prop-types': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-no-useless-fragment': 'warn',

    // Imports
    'no-duplicate-imports': 'error',
  },
};
