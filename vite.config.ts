import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true // Esto abre el navegador automáticamente
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar librerías pesadas en chunks individuales
          // Esto reduce memoria durante build y mejora cache del navegador
          'html2canvas': ['html2canvas'],
          'jspdf': ['jspdf'],
          'jszip': ['jszip'],
          'xlsx': ['xlsx'],
          'react-vendor': ['react', 'react-dom'],
          'confetti': ['canvas-confetti']
        }
      }
    },
    // Aumentar límite de advertencia ya que separamos en chunks
    chunkSizeWarningLimit: 1000
  }
})