const logger = require('../config/logger');

// Custom CustomError class to throw HTTP-related API errors
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Express global error handler middleware
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';
  let details = err.details || [];

  // Log error stack for severe errors (500)
  if (statusCode === 500) {
    logger.error(`[500 Server Error] Path: ${req.method} ${req.originalUrl}`);
    logger.error(err.stack || err);
  } else {
    logger.warn(`[${statusCode} API Warning] Path: ${req.method} ${req.originalUrl} - Code: ${errorCode} - Message: ${message}`);
  }

  // Handle specific database errors (like unique constraint violation in mysql2)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'A record with this unique attribute already exists.';
    details = [];
  }

  // Production security hardening: Mask all raw 500 errors
  const isProduction = process.env.NODE_ENV === 'production';
  if (statusCode === 500 && isProduction) {
    message = 'An unexpected error occurred on the server.';
    details = [];
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(isProduction ? {} : { details }),
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  APIError,
  errorHandler
};
