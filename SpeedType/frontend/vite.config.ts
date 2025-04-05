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
      // Expose env variables to the client
      __VITE_BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL),
      __VITE_NODE_ENV__: JSON.stringify(env.VITE_NODE_ENV),
      __VITE_SOCKET_TIMEOUT__: env.VITE_SOCKET_TIMEOUT,
      __VITE_RETRY_DELAY__: env.VITE_RETRY_DELAY,
      __VITE_RECONNECTION_ATTEMPTS__: env.VITE_RECONNECTION_ATTEMPTS,
      __VITE_SOCKET_TRANSPORTS__: JSON.stringify(env.VITE_SOCKET_TRANSPORTS),
      __VITE_SOCKET_AUTO_CONNECT__: env.VITE_SOCKET_AUTO_CONNECT === 'true',
      __VITE_SOCKET_RECONNECTION__: env.VITE_SOCKET_RECONNECTION === 'true'
    }
  };
}); 