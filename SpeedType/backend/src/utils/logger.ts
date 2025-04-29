import dotenv from 'dotenv';
// Load environment variables from the correct file based on NODE_ENV
if (process.env.NODE_ENV) {
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
} else {
  dotenv.config(); // Fallback to default .env
}

import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV !== 'production' ? 'debug' : 'info');

const logger = pino({
  level: logLevel,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

console.log('Effective logger level:', logger.level);

export default logger;