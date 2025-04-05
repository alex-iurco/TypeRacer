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
    define: {
      // Expose env variables to the client with the same names they're using
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(env.VITE_NODE_ENV),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
      'import.meta.env.VITE_SOCKET_TIMEOUT': env.VITE_SOCKET_TIMEOUT,
      'import.meta.env.VITE_RETRY_DELAY': env.VITE_RETRY_DELAY,
      'import.meta.env.VITE_RECONNECTION_ATTEMPTS': env.VITE_RECONNECTION_ATTEMPTS,
      'import.meta.env.VITE_SOCKET_TRANSPORTS': JSON.stringify(env.VITE_SOCKET_TRANSPORTS),
      'import.meta.env.VITE_SOCKET_AUTO_CONNECT': env.VITE_SOCKET_AUTO_CONNECT === 'true',
      'import.meta.env.VITE_SOCKET_RECONNECTION': env.VITE_SOCKET_RECONNECTION === 'true'
    }
  };
}); 