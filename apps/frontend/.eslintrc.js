module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
  ],
  rules: {
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
