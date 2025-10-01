import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into its own chunk
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/database'],
          // Split React libraries
          'react-vendor': ['react', 'react-dom'],
          // Split lucide icons
          'icons': ['lucide-react'],
          // Split QR code library
          'qrcode': ['qrcode.react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})