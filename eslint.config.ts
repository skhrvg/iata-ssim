import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    vue: false,
    formatters: true,
    stylistic: true,
    ignores: [
      'dist',
      'docs/**/*.md',
      'docs/.vitepress/cache',
      'docs/.vitepress/dist',
      '*.ssim',
      'node_modules',
      'README.md',
    ],
  },
  {
    // Tests build 200-byte fixed-width SSIM records by string concatenation
    // with inline byte-position comments — `prefer-template` would mangle them.
    files: ['test/**/*.test.ts'],
    rules: {
      'prefer-template': 'off',
      'style/operator-linebreak': 'off',
      'style/indent-binary-ops': 'off',
    },
  },
  {
    // CLI tooling — not part of the published library; relax rules around
    // console output, globals, dist imports and stylistic nits.
    files: ['scripts/**/*.mjs', 'samples-validator/**/*.ts'],
    rules: {
      'antfu/curly': 'off',
      'antfu/if-newline': 'off',
      'antfu/no-import-dist': 'off',
      'no-console': 'off',
      'node/prefer-global/process': 'off',
      'prefer-template': 'off',
      'style/operator-linebreak': 'off',
      'style/indent-binary-ops': 'off',
    },
  },
)
