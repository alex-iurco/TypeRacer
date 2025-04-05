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
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.VITE_NODE_ENV || 'production'),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || 'https://speedtype-backend-production.up.railway.app'),
      'import.meta.env.VITE_SOCKET_TIMEOUT': JSON.stringify(process.env.VITE_SOCKET_TIMEOUT || 5000),
      'import.meta.env.VITE_RETRY_DELAY': JSON.stringify(process.env.VITE_RETRY_DELAY || 1000),
      'import.meta.env.VITE_RECONNECTION_ATTEMPTS': JSON.stringify(process.env.VITE_RECONNECTION_ATTEMPTS || 5),
      'import.meta.env.VITE_SOCKET_TRANSPORTS': JSON.stringify(process.env.VITE_SOCKET_TRANSPORTS || '["websocket","polling"]'),
      'import.meta.env.VITE_SOCKET_AUTO_CONNECT': JSON.stringify(process.env.VITE_SOCKET_AUTO_CONNECT || true),
      'import.meta.env.VITE_SOCKET_RECONNECTION': JSON.stringify(process.env.VITE_SOCKET_RECONNECTION || true),
    }
  };
}); 