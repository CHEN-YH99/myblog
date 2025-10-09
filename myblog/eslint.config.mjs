import { createESLintConfig } from '../shared/config/eslint.config.mjs'

// 使用共享配置，针对前台项目进行定制
export default createESLintConfig({
  projectRoot: process.cwd(),
  isAdmin: false,
  additionalIgnores: [
    'src/service/**',
    'src/assets/images/**'
  ]
})