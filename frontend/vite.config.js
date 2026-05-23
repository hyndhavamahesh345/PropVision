import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  define: {
    // Expose backend URL to the app — set VITE_API_URL in Vercel env vars
    // Falls back to '' (relative) for local dev where proxy handles /api
    __API_BASE__: JSON.stringify(
      mode === 'production'
        ? (process.env.VITE_API_URL || '')
        : ''
    ),
  },
}))
