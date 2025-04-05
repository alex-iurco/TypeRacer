import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/',
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
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
    envPrefix: 'VITE_',
    define: {
      // Expose env variables to the client
      'process.env': {}
    }
  };
}); 