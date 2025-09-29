import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

/**
 * 创建基础Vite配置
 * @param options 配置选项
 * @returns Vite配置
 */
export function createViteConfig(options: {
  /** 项目根目录 */
  root?: string
  /** 是否为管理端项目 */
  isAdmin?: boolean
  /** 额外的别名配置 */
  additionalAlias?: Record<string, string>
  /** 额外的插件 */
  additionalPlugins?: any[]
  /** 自定义服务器配置 */
  serverConfig?: {
    port?: number
    proxy?: Record<string, any>
  }
} = {}) {
  const {
    root = process.cwd(),
    isAdmin = false,
    additionalAlias = {},
    additionalPlugins = [],
    serverConfig = {}
  } = options

  return defineConfig(({ mode }) => {
    const env = loadEnv(mode, root)
    const { VITE_API_PROXY_URL, VITE_PORT } = env

    // 基础别名配置
    const baseAlias = {
      '@': resolve(root, './src'),
      '@shared': resolve(root, '../../shared')
    }

    // 管理端额外别名
    const adminAlias = isAdmin ? {
      '@views': resolve(root, 'src/views'),
      '@imgs': resolve(root, 'src/assets/img'),
      '@icons': resolve(root, 'src/assets/icons'),
      '@utils': resolve(root, 'src/utils'),
      '@stores': resolve(root, 'src/store'),
      '@plugins': resolve(root, 'src/plugins'),
      '@styles': resolve(root, 'src/assets/styles')
    } : {}

    // 基础插件
    const basePlugins = [
      vue(),
      ...additionalPlugins
    ]

    // 基础服务器配置
    const baseServerConfig = {
      port: Number(VITE_PORT) || (isAdmin ? 5174 : 5173),
      host: true,
      proxy: {
        '/api': {
          target: VITE_API_PROXY_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path: string) => path
        },
        '/uploads': {
          target: VITE_API_PROXY_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path: string) => path
        },
        ...serverConfig.proxy
      },
      ...serverConfig
    }

    const config: UserConfig = {
      base: env.VITE_BASE_URL || '/',
      plugins: basePlugins,
      resolve: {
        alias: {
          ...baseAlias,
          ...adminAlias,
          ...additionalAlias
        }
      },
      server: baseServerConfig,
      build: {
        target: 'es2015',
        outDir: 'dist',
        sourcemap: mode === 'development',
        minify: mode === 'production' ? 'terser' : false,
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['vue', 'vue-router', 'pinia']
            }
          }
        }
      },
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern-compiler',
            additionalData: isAdmin ? `
              @use "@styles/variables.scss" as *; 
              @use "@styles/mixin.scss" as *;
            ` : ''
          }
        }
      },
      define: {
        __APP_VERSION__: JSON.stringify(env.VITE_VERSION || '1.0.0')
      }
    }

    // 生产环境优化
    if (mode === 'production' && config.build) {
      config.build.terserOptions = {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }

    return config
  })
}

/**
 * 解析路径工具函数
 */
export function resolvePath(relativePath: string, basePath: string = process.cwd()): string {
  return resolve(basePath, relativePath)
}