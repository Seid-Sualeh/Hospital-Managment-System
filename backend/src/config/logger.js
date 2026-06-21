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

// Determine transports dynamically based on platform
const transports = [
  new winston.transports.Console({
    format: consoleFormat
  })
];

// Serverless read-only filesystem check (e.g. Vercel)
const isServerless = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);

if (!isServerless) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: fileFormat
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: fileFormat
    })
  );
}

const logger = winston.createLogger({
  level,
  transports
});

module.exports = logger;
