const { createLogger, format, transports } = require('winston');
const getEnvironmentVariables = require('../Environment/env');
const levelSymbols = {
  info: 'ℹ️',  // Information
  warn: '⚠️',  // Warning
  error: '❌', // Error
  debug: '🐛', // Debug
};

const logger = createLogger({
  level: getEnvironmentVariables().LEVEL,
  format: format.combine(
   format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
   format.errors({ stack: true }), // Automatically include error stack traces
   format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
   format.printf(({ timestamp, level, message, metadata, stack }) => {
    const symbol = levelSymbols[level] || '';
    const meta = Object.keys(metadata).length ? ` | Metadata: ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${symbol}: ${message}${stack ? `\nStack: ${stack}` : ''}${meta}`;
  })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'server.log' })
  ],
});

module.exports = logger;
