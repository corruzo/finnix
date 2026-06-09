import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para scraping de tasas — evita CORS en desarrollo
      '/api/scrape/usdt': {
        target: 'https://www.usdt.com.ve',
        changeOrigin: true,
        rewrite: () => '/',
        secure: false,
      },
      '/api/scrape/bcv': {
        target: 'https://www.bcv.org.ve',
        changeOrigin: true,
        rewrite: () => '/',
        secure: false,
      },
    },
  },
})
