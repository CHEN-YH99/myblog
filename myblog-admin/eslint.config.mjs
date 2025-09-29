import { createESLintConfig } from '../shared/config/eslint.config.mjs'

// 使用共享配置，针对管理端项目进行定制
export default createESLintConfig({
  projectRoot: process.cwd(),
  isAdmin: true,
  additionalIgnores: [
    'scripts/**',
    'src/assets/img/**',
    'src/assets/icons/**'
  ]
})
