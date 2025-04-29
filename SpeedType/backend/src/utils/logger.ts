import dotenv from 'dotenv';
dotenv.config();

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