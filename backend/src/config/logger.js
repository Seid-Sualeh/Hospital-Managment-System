const winston = require('winston');
const path = require('path');

// Define log level based on environment
const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Custom format for clean console logs
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Custom format for files (JSON-based)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level,
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Write error logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: fileFormat
    }),
    // Write all combined logs to file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: fileFormat
    })
  ]
});

module.exports = logger;
