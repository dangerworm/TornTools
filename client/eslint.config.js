import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import prettierPlugin from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Global ignores (for all configs)
  globalIgnores(['dist', 'coverage', 'build']),

  {
    files: ['**/*.{ts,tsx}'],

    // Base configs
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,            // swap to recommendedTypeChecked if you want stricter, type-aware rules
      reactPlugin.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettierPlugin.configs.recommended,      // turns on prettier/prettier and disables conflicting rules
    ],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        // For type-aware rules, point this at your TS config(s)
        // If you don't want type-aware rules, you can omit "project"
        project: ['./tsconfig.json'],
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },

    plugins: {
      'simple-import-sort': simpleImportSort,
    },

    rules: {
      // --- TypeScript tweaks ---
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // --- React tweaks ---
      'react/react-in-jsx-scope': 'off', // for new JSX transform
      'react/prop-types': 'off',         // using TS instead of prop-types

      // --- Import sorting ---
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',

      // You can add any project-specific rules here
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
])
