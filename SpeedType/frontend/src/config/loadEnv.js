/**
 * Initialize and validate frontend environment variables
 * @returns {void}
 */
export const initializeEnv = () => {
  const mode = import.meta.env.MODE;

  // Validate mode
  if (!['development', 'production', 'test'].includes(mode)) {
    console.warn(`Invalid environment mode: ${mode}, falling back to development`);
  }

  // Log environment initialization
  console.log(`Environment initialized: ${mode}`);

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

  const missing = requiredVars.filter(key => {
    const value = import.meta.env[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    console.error('Environment variables:', import.meta.env);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Log environment details
  console.log('Using backend URL:', import.meta.env.VITE_BACKEND_URL);
} 