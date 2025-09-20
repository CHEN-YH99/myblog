import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_API_PROXY_URL } = env

  return defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        '/api': {
          target: VITE_API_PROXY_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path // 保持/api前缀
        },
        '/uploads': {
          target: VITE_API_PROXY_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path // 保持/uploads前缀
        }
      }
    }
  })
}
