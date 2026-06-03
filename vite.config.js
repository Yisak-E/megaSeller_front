import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mega-seller-backend.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
