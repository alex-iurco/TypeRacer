// Environment configuration for backend
import { initializeEnv } from './loadEnv';

// Initialize environment variables
initializeEnv();

type Environment = 'development' | 'production';

interface EnvironmentConfig {
  PORT: string | number;
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

// Helper function to parse comma-separated string to array
const parseArrayFromEnv = (value: string | undefined): string[] => {
  if (!value) {
    throw new Error('Required environment variable is missing');
  }
  return value.split(',').map(item => item.trim());
};

// Helper function to parse port
const parsePort = (value: string | undefined): number => {
  if (!value) {
    throw new Error('PORT environment variable is missing');
  }
  const port = parseInt(value);
  if (isNaN(port)) {
    throw new Error('PORT must be a valid number');
  }
  return port;
};

const ENV: EnvironmentConfigs = {
  development: {
    PORT: parsePort(process.env.PORT),
    ALLOWED_ORIGINS: parseArrayFromEnv(process.env.ALLOWED_ORIGINS),
    SOCKET_CONFIG: {
      cors: {
        origin: parseArrayFromEnv(process.env.ALLOWED_ORIGINS),
        methods: parseArrayFromEnv(process.env.CORS_METHODS),
        credentials: process.env.CORS_CREDENTIALS === 'true'
      }
    }
  },
  production: {
    PORT: parsePort(process.env.PORT),
    ALLOWED_ORIGINS: parseArrayFromEnv(process.env.ALLOWED_ORIGINS),
    SOCKET_CONFIG: {
      cors: {
        origin: parseArrayFromEnv(process.env.ALLOWED_ORIGINS),
        methods: parseArrayFromEnv(process.env.CORS_METHODS),
        credentials: process.env.CORS_CREDENTIALS === 'true'
      }
    }
  }
};

// Get current environment
const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV as Environment;
  if (!env || !ENV[env]) {
    console.warn(`Invalid environment: ${env}, falling back to development`);
    return 'development';
  }
  return env;
};

// Get configuration for current environment
const getCurrentConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  console.log('Backend running in environment:', env);
  const config = ENV[env];
  return config;
};

export const config = getCurrentConfig(); 