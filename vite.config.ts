import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKEND = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    watch: {
      ignored: ['**/*.zip', '**/hooks-audit.zip'],
    },
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: '',
      },
      '/sanctum': {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: '',
      },
      '/storage': {
        target: BACKEND,
        changeOrigin: true,
      },
      '/up': {
        target: BACKEND,
        changeOrigin: true,
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'axios',
      'dompurify',
    ],
  },

  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'react-dom'
            if (id.includes('react-router') || id.includes('@remix-run/router')) {
              return 'router'
            }
            if (id.includes('/react/') || id.endsWith('\\react\\index.js')) {
              return 'react'
            }
            if (id.includes('axios')) return 'axios'
            if (id.includes('dompurify')) return 'dompurify'
            if (id.includes('@fortawesome')) return 'icons'
            return 'vendor'
          }

          if (id.includes('/pages/Admin/')) return 'admin'
          if (id.includes('/pages/Seller/')) return 'seller'
          if (id.includes('/pages/Storefront/')) return 'storefront'
        },
      },
    },
  },
})
