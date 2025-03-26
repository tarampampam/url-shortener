import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['dist/*', 'src/server/*.gen.d.ts'],
  },
  {
    files: ['**/*.{js,ts,tsx}'],
  },
  {
    files: ['src/client/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  tseslint.configs.recommended,
])
