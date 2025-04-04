/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  plugins: ['prettier-plugin-svelte'],
  semi: false,
  tabWidth: 2,
  singleQuote: true,
  printWidth: 120,
  trailingComma: 'es5',
}

export default config
