// Environment configuration for backend
import { initializeEnv } from './loadEnv';
import { parsePort, parseArrayFromEnv, validateMode } from './envUtils';

// Initialize environment variables
initializeEnv();

type Environment = 'development' | 'production';

interface EnvironmentConfig {
  PORT: number;
  ALLOWED_ORIGINS: string[];
  SOCKET_CONFIG: {
    cors: {
      origin: string[];
      methods: string[];
      credentials: boolean;
    };
  };
}

type EnvironmentConfigs = {
  [key in Environment]: EnvironmentConfig;
};

// Create environment-specific configuration
const createEnvConfig = (): EnvironmentConfig => {
  return {
    PORT: parsePort(process.env.PORT),
    ALLOWED_ORIGINS: parseArrayFromEnv(process.env.ALLOWED_ORIGINS),
    SOCKET_CONFIG: {
      cors: {
        origin: parseArrayFromEnv(process.env.ALLOWED_ORIGINS),
        methods: parseArrayFromEnv(process.env.CORS_METHODS),
        credentials: process.env.CORS_CREDENTIALS === 'true'
      }
    }
  };
};

const ENV: EnvironmentConfigs = {
  development: createEnvConfig(),
  production: createEnvConfig()
};

// Get current environment
const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV as string;
  return validateMode(env, ['development', 'production'], 'development') as Environment;
};

// Get configuration for current environment
const getCurrentConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  console.log('Backend running in environment:', env);
  const config = ENV[env];
  return config;
};

export const config = getCurrentConfig(); 