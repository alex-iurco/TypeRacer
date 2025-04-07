import dotenv from 'dotenv';
import path from 'path';

/**
 * Shared utilities for environment configuration (backend)
 */

/**
 * Loads environment variables from the appropriate file
 * @param {string} mode - The environment mode ('development', 'production', etc)
 * @returns {dotenv.DotenvConfigOutput} - Result of dotenv.config
 */
export const loadEnvFile = (mode: string): dotenv.DotenvConfigOutput => {
  const envFile = path.resolve(process.cwd(), `.env.${mode}`);
  const result = dotenv.config({ path: envFile });
  
  if (result.error) {
    throw new Error(`Error loading environment file ${envFile}: ${result.error.message}`);
  }
  
  console.log(`Using environment file: ${envFile}`);
  return result;
};

/**
 * Validates if all required environment variables are present
 * @param {string[]} requiredVars - List of required variable names
 * @returns {string[]} - List of missing variables (empty if all present)
 */
export const validateRequiredVars = (requiredVars: string[]): string[] => {
  return requiredVars.filter(key => !process.env[key]);
};

/**
 * Logs environment initialization details
 * @param {string} mode - The environment mode
 */
export const logEnvironmentInfo = (mode: string): void => {
  console.log(`Environment initialized: ${mode}`);
  
  // Log important environment variables (without exposing sensitive data)
  if (process.env.PORT) {
    console.log(`Server will run on port: ${process.env.PORT}`);
  }
  
  if (process.env.ALLOWED_ORIGINS) {
    console.log(`Allowed CORS origins: ${process.env.ALLOWED_ORIGINS}`);
  }
};

/**
 * Parse a port value with validation
 * @param {string | undefined} portValue - The port value from env
 * @returns {number} - The parsed port number or default (3001)
 */
export const parsePort = (portValue: string | undefined): number => {
  if (!portValue) return 3001;
  const port = parseInt(portValue, 10);
  return !isNaN(port) && port > 0 && port < 65536 ? port : 3001;
};

/**
 * Parse a comma-separated string into an array
 * @param {string | undefined} value - The comma-separated string
 * @returns {string[]} - The parsed array or default value
 */
export const parseArrayFromEnv = (value: string | undefined): string[] => {
  if (!value) return ['*'];
  return value.split(',').map(item => item.trim());
};

/**
 * Validate environment mode and return normalized value
 * @param {string} mode - The environment mode
 * @param {string[]} validModes - List of valid modes
 * @param {string} defaultMode - Default mode if invalid
 * @returns {string} - The validated mode
 */
export const validateMode = (
  mode: string, 
  validModes: string[] = ['development', 'production'], 
  defaultMode: string = 'development'
): string => {
  if (!mode || !validModes.includes(mode)) {
    console.warn(`Invalid environment mode: ${mode}, falling back to ${defaultMode}`);
    return defaultMode;
  }
  return mode;
}; 