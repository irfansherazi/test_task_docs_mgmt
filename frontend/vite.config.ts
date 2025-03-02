import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  server: {
    open: true, 
    port: 3000,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-viewer': ['react-pdf'],
          'modal': ['react-modal'],
          'http-client': ['axios']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-pdf', 'react-modal', 'axios']
  }
})
