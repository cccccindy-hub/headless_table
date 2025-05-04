// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // any request that starts with /api will be forwarded to your Spring Boot
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // optionally strip the /api prefix (not needed here since your back end expects /api/…)
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
