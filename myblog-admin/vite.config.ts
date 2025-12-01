import { createViteConfig } from '../shared/config/vite.config.base'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import viteCompression from 'vite-plugin-compression'
import type { PluginOption } from 'vite'

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
        globalsPropValue: true,
      },
    }),
    Components({
      deep: true,
      extensions: ['vue'],
      dirs: ['src/components'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts',
    }),
    // 仅在生产构建时启用压缩，减小网络负载（gzip + brotli 均可按需开启）
    viteCompression({
      verbose: false,
      disable: process.env.NODE_ENV !== 'production',
      filter: (file) => /\.(js|mjs|css|json|wasm|svg)$/.test(file),
      threshold: 8 * 1024, // 仅压缩 >8KB 的资源
      algorithm: 'gzip',
      ext: '.gz',
    }) as PluginOption,
    // 如需同时产出 .br，可再增加一条：
    // viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 8 * 1024 }) as PluginOption,
  ],
  serverConfig: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // 生产构建优化项：最小化 JS/CSS，拆分更细的 vendor chunk，提升浏览器缓存复用
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2019',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // 进一步去除常见 console 调用
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      format: { comments: false },
    },
    brotliSize: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 按依赖包拆分，更好地利用浏览器缓存与并行加载
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // 取包名作为 chunk 名，如 node_modules/element-plus/... -> element-plus
            const parts = id.split('node_modules/')[1].split('/')
            const name = parts[0].startsWith('_') ? parts[1] : parts[0]
            // 针对常见大依赖单独拆分
            if (/element-plus|vue|vue-router|pinia|echarts|md-editor-v3|monaco-editor/.test(name)) {
              return name
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
