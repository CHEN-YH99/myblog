import { createViteConfig } from '../shared/config/vite.config.base'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// 使用共享配置，针对管理端项目进行定制
export default createViteConfig({
  root: process.cwd(),
  isAdmin: true,
  additionalPlugins: [
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.auto-import.json',
        globalsPropValue: true
      }
    }),
    Components({
      deep: true,
      extensions: ['vue'],
      dirs: ['src/components'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts'
    })
  ],
  serverConfig: {
    port: 5174
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
