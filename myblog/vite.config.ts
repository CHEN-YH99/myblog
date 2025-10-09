import { createViteConfig } from '../shared/config/vite.config.base'

// 使用共享配置，针对前台项目进行定制
export default createViteConfig({
  root: process.cwd(),
  isAdmin: false,
  serverConfig: {
    port: 5173
  }
})
