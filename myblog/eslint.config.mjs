// 关闭大多数规则的极简 ESLint 配置，避免因代码规范产生红色波浪线
import globals from 'globals'

export default [
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {}
  },
  {
    ignores: [
      '**/*.vue',
      '**/*.ts',
      '**/*.d.ts',
      'node_modules',
      'dist',
      'public',
      '.vscode/**',
      'src/assets/**',
      'uploads/**'
    ]
  }
]
