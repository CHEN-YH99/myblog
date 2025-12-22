import { createViteConfig } from '../shared/config/vite.config.base'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import type { PluginOption } from 'vite'

// 使用共享配置，针对管理端项目进行定制
export default createViteConfig({
  root: process.cwd(),
  isAdmin: true,
  additionalPlugins: [
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'],
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      dts: 'src/types/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.auto-import.json',
        globalsPropValue: true,
      },
    }),
    Components({
      deep: true,
      extensions: ['vue'],
      dirs: ['src/components'],
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      dts: 'src/types/components.d.ts',
    }),
    // 仅在生产构建时启用压缩，减小网络负载（gzip）
    viteCompression({
      verbose: false,
      disable: process.env.NODE_ENV !== 'production',
      filter: (file) => /\.(js|mjs|css|json|wasm|svg)$/.test(file),
      threshold: 8 * 1024,
      algorithm: 'gzip',
      ext: '.gz',
    }) as PluginOption,
    // 如需同时产出 .br，可再增加一条：
    // viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 8 * 1024 }) as PluginOption,
  ],
  serverConfig: {
    port: 5174,
  },
})
