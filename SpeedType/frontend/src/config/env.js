// Environment configuration
import { initializeEnv } from './loadEnv';

// Initialize environment variables
initializeEnv();

const ENV = {
  development: {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    SOCKET_TIMEOUT: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT),
    RETRY_DELAY: parseInt(import.meta.env.VITE_RETRY_DELAY),
    SOCKET_CONFIG: {
      transports: (import.meta.env.VITE_SOCKET_TRANSPORTS || 'websocket,polling').split(','),
      autoConnect: import.meta.env.VITE_SOCKET_AUTO_CONNECT !== 'false',
      reconnection: import.meta.env.VITE_SOCKET_RECONNECTION !== 'false',
      reconnectionAttempts: parseInt(import.meta.env.VITE_RECONNECTION_ATTEMPTS),
      reconnectionDelay: parseInt(import.meta.env.VITE_RETRY_DELAY),
      forceNew: true,
      timeout: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT),
      path: '/socket.io/',
      rejectUnauthorized: false,
      upgrade: true,
      rememberUpgrade: true,
      secure: true
    }
  },
  production: {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    SOCKET_TIMEOUT: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT),
    RETRY_DELAY: parseInt(import.meta.env.VITE_RETRY_DELAY),
    SOCKET_CONFIG: {
      transports: (import.meta.env.VITE_SOCKET_TRANSPORTS || 'websocket,polling').split(','),
      autoConnect: import.meta.env.VITE_SOCKET_AUTO_CONNECT !== 'false',
      reconnection: import.meta.env.VITE_SOCKET_RECONNECTION !== 'false',
      reconnectionAttempts: parseInt(import.meta.env.VITE_RECONNECTION_ATTEMPTS),
      reconnectionDelay: parseInt(import.meta.env.VITE_RETRY_DELAY),
      forceNew: true,
      timeout: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT),
      path: '/socket.io/',
      rejectUnauthorized: false,
      upgrade: true,
      rememberUpgrade: true,
      secure: true
    }
  },
  // You can add more environments here (staging, testing, etc.)
};

// Helper function to validate required environment variables
const validateConfig = (config) => {
  const { BACKEND_URL, SOCKET_TIMEOUT, RETRY_DELAY, SOCKET_CONFIG } = config;
  
  if (!BACKEND_URL) throw new Error('VITE_BACKEND_URL is required');
  if (isNaN(SOCKET_TIMEOUT)) throw new Error('VITE_SOCKET_TIMEOUT must be a valid number');
  if (isNaN(RETRY_DELAY)) throw new Error('VITE_RETRY_DELAY must be a valid number');
  if (isNaN(SOCKET_CONFIG.reconnectionAttempts)) throw new Error('VITE_RECONNECTION_ATTEMPTS must be a valid number');
  if (!SOCKET_CONFIG.transports || SOCKET_CONFIG.transports.length === 0) throw new Error('VITE_SOCKET_TRANSPORTS is required');
};

// Get current environment
const getEnvironment = () => {
  const env = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE;
  if (!env || !ENV[env]) {
    console.warn(`Invalid environment: ${env}, falling back to development`);
    return 'development';
  }
  return env;
};

// Get configuration for current environment
const getCurrentConfig = () => {
  const env = getEnvironment();
  console.log('Current environment:', env);
  const config = ENV[env];
  validateConfig(config);
  return config;
};

export const config = getCurrentConfig(); 