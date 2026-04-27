import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 拦截所有 /api 开头的请求
      '/api': {
        target: 'http://localhost:8080', // 你 Spring Boot 项目的实际地址和端口
        changeOrigin: true, // 允许跨域
        // 如果你的后端接口不带 /api 前缀，需要把这里解开进行路径重写
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})