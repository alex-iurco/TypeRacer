import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    }
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
    open: true
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  define: {
    'process.env.BACKEND_URL': JSON.stringify(process.env.NODE_ENV === 'production'
      ? 'https://speedtype-backend-production.up.railway.app'
      : 'http://localhost:3001'
    ),
  },
}); 