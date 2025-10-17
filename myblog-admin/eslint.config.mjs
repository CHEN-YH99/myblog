// 统一的ESLint配置文件
import fs from 'fs'
import path from 'path'

// 从 ESLint 插件中导入推荐配置
import pluginJs from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// 尝试读取自动导入配置
let autoImportGlobals = {}
try {
  const autoImportPath = path.resolve(process.cwd(), '.auto-import.json')
  if (fs.existsSync(autoImportPath)) {
    const autoImportConfig = JSON.parse(
      fs.readFileSync(autoImportPath, 'utf-8')
    )
    autoImportGlobals = autoImportConfig.globals || {}
  }
} catch (error) {
  console.warn('无法读取自动导入配置:', error.message)
}

export default [
  // 指定文件匹配规则
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}']
  },
  // 指定全局变量和环境
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  // 扩展配置
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  // 自定义规则
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      globals: {
        ...autoImportGlobals,
        // TypeScript 全局命名空间
        Api: 'readonly',
        Form: 'readonly'
      }
    },
    rules: {
      quotes: ['error', 'single'], // 使用单引号
      semi: ['error', 'never'], // 语句末尾不加分号
      'no-var': 'error', // 要求使用 let 或 const 而不是 var
      '@typescript-eslint/no-explicit-any': 'warn', // any 类型警告
      '@typescript-eslint/no-unused-vars': 'warn', // 未使用变量警告
      'vue/multi-word-component-names': 'off', // 禁用对 Vue 组件名称的多词要求检查
      'no-multiple-empty-lines': ['warn', { max: 1 }], // 不允许多个空行
      'no-unexpected-multiline': 'error', // 禁止空余的多行
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // 生产环境警告console
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off' // 生产环境禁止debugger
    }
  },
  // Vue 规则
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    }
  },
  // 忽略文件
  {
    ignores: [
      'node_modules',
      'dist',
      'public',
      '.vscode/**',
      'src/assets/**',
      'uploads/**',
      '**/*.d.ts',
      'scripts/**',
      'src/assets/img/**',
      'src/assets/icons/**'
    ]
  },
  // Prettier 配置
  eslintPluginPrettierRecommended
]
