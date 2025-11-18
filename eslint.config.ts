import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  // Configurações JS e TS
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },
    extends: [
      js.configs.recommended, // Regras JS recomendadas
      ...tseslint.configs.recommended, // Regras TS recomendadas
    ],
  },

  // ⬇️ Sempre por último — recomendação oficial do Prettier
  prettierRecommended,
])
