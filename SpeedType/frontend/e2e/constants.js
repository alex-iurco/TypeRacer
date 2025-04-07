/**
 * E2E Testing Environment Constants
 * 
 * This file defines constants for different environments used in E2E tests.
 * When updating production URLs, only this file needs to be changed.
 */

// URLs for different environments
export const URLs = {
  development: {
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:3001'
  },
  test: {
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:3001'
  },
  production: {
    frontend: 'https://speedtype.robocat.ai',
    backend: 'https://speedtype-backend-production.up.railway.app'
  }
};

// Extract domain names for more flexible testing (without protocol)
export const DOMAINS = {
  development: {
    frontend: 'localhost:3000',
    backend: 'localhost:3001'
  },
  test: {
    frontend: 'localhost:3000',
    backend: 'localhost:3001'
  },
  production: {
    frontend: 'speedtype.robocat.ai',
    backend: 'speedtype-backend-production.up.railway.app'
  }
};

// Helper function to get the current environment
export const getCurrentEnvironment = () => {
  return process.env.PLAYWRIGHT_ENV === 'production' 
    ? 'production' 
    : 'test';
};

// Export current environment URLs based on PLAYWRIGHT_ENV
export const CURRENT = {
  get urls() {
    return URLs[getCurrentEnvironment()];
  },
  get domains() {
    return DOMAINS[getCurrentEnvironment()];
  }
}; 