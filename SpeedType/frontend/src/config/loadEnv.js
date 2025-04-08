import { validateRequiredVars, logEnvironmentInfo, validateMode } from './envUtils';

/**
 * Initialize and validate frontend environment variables
 * @returns {void}
 */
export const initializeEnv = () => {
  const validModes = ['development', 'production', 'test'];
  const defaultMode = 'development';
  const mode = validateMode(import.meta.env.MODE, validModes, defaultMode);

  // Validate required environment variables
  const requiredVars = [
    'VITE_NODE_ENV',
    'VITE_BACKEND_URL',
    'VITE_SOCKET_TIMEOUT',
    'VITE_RETRY_DELAY',
    'VITE_RECONNECTION_ATTEMPTS',
    'VITE_SOCKET_TRANSPORTS',
    'VITE_SOCKET_AUTO_CONNECT',
    'VITE_SOCKET_RECONNECTION'
  ];

  const missing = validateRequiredVars(import.meta.env, requiredVars);

  if (missing.length > 0) {
    console.error('Environment variables:', import.meta.env);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Log environment details
  const config = {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL
  };
  logEnvironmentInfo(mode, config);
} 