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
      // 拦截所有以 /api 开头的请求
      '/api': {
        target: 'http://localhost:8080', // 注意：这里必须是你 Java Spring Boot 实际启动的端口！
        changeOrigin: true,
        // 将 /api/article 重写为 /article，完美对接你的后端 @RequestMapping("/article")
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})