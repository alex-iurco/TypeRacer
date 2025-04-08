import { 
  loadEnvFile, 
  validateRequiredVars, 
  logEnvironmentInfo, 
  validateMode 
} from './envUtils';

/**
 * Initialize environment variables
 * @param mode - 'development' | 'production'
 */
export const initializeEnv = (inputMode: string = process.env.NODE_ENV || 'development') => {
  // Validate mode
  const validModes = ['development', 'production'];
  const defaultMode = 'development';
  const mode = validateMode(inputMode, validModes, defaultMode);

  // Set NODE_ENV
  process.env.NODE_ENV = mode;

  // Load environment variables from the appropriate file
  loadEnvFile(mode);

  // Validate required environment variables
  const requiredVars = [
    'PORT',
    'ALLOWED_ORIGINS',
    'CORS_METHODS',
    'CORS_CREDENTIALS'
  ];

  const missing = validateRequiredVars(requiredVars);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Log environment details
  logEnvironmentInfo(mode);
} 