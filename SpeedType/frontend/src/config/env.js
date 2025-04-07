// Environment configuration
import { initializeEnv } from './loadEnv';
import { parseIntWithDefault, parseArrayFromString, validateMode } from './envUtils';

// Initialize environment variables
initializeEnv();

// Create environment-specific socket configuration
const createSocketConfig = (env) => {
  return {
    transports: parseArrayFromString(env.VITE_SOCKET_TRANSPORTS, ['polling', 'websocket']),
    autoConnect: env.VITE_SOCKET_AUTO_CONNECT !== 'false',
    reconnection: env.VITE_SOCKET_RECONNECTION !== 'false',
    reconnectionAttempts: parseIntWithDefault(env.VITE_RECONNECTION_ATTEMPTS, 5),
    reconnectionDelay: parseIntWithDefault(env.VITE_RETRY_DELAY, 1000),
    forceNew: true,
    timeout: parseIntWithDefault(env.VITE_SOCKET_TIMEOUT, 5000),
    path: '/socket.io/',
    rejectUnauthorized: false,
    upgrade: true,
    rememberUpgrade: true,
    secure: true,
    withCredentials: true,
    extraHeaders: {
      'X-Client-Version': '1.0.1'
    },
    transportOptions: {
      polling: {
        extraHeaders: {
          'X-Client-Version': '1.0.1'
        }
      }
    },
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5
  };
};

// Create environment configuration from environment variables
const createEnvConfig = (env) => {
  return {
    BACKEND_URL: env.VITE_BACKEND_URL,
    SOCKET_TIMEOUT: parseIntWithDefault(env.VITE_SOCKET_TIMEOUT, 5000),
    RETRY_DELAY: parseIntWithDefault(env.VITE_RETRY_DELAY, 1000),
    SOCKET_CONFIG: createSocketConfig(env)
  };
};

const ENV = {
  development: createEnvConfig(import.meta.env),
  production: createEnvConfig(import.meta.env),
  test: createEnvConfig(import.meta.env)
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
  return validateMode(env, ['development', 'production', 'test'], 'development');
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