// CommonJS variant to avoid Node warning about module type.
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
      globals: {
        console: 'readonly', process: 'readonly', Buffer: 'readonly', require: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', __dirname: 'readonly', __filename: 'readonly'
      }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off'
    }
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', jest: 'readonly' }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: { '@typescript-eslint/no-unused-vars': 'off', 'no-unused-vars': 'off' }
  }
];