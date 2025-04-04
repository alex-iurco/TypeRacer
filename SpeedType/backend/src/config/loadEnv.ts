import dotenv from 'dotenv';
import path from 'path';

/**
 * Initialize environment variables
 * @param mode - 'development' | 'production'
 */
export const initializeEnv = (mode: string = process.env.NODE_ENV || 'development') => {
  // Validate mode
  if (!['development', 'production'].includes(mode)) {
    console.warn(`Invalid environment mode: ${mode}, falling back to development`);
    mode = 'development';
  }

  // Set NODE_ENV
  process.env.NODE_ENV = mode;

  // Load environment variables from the appropriate file
  const envFile = path.resolve(process.cwd(), `.env.${mode}`);
  const result = dotenv.config({ path: envFile });

  if (result.error) {
    throw new Error(`Error loading environment file ${envFile}: ${result.error.message}`);
  }

  // Log environment initialization
  console.log(`Environment initialized: ${mode}`);
  console.log(`Using environment file: ${envFile}`);

  // Validate required environment variables
  const requiredVars = [
    'PORT',
    'ALLOWED_ORIGINS',
    'CORS_METHODS',
    'CORS_CREDENTIALS'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 