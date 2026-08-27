const logger = require('../services/logger');

function errorHandler(err, req, res, next) {
  logger.error(`API Error on ${req.method} ${req.originalUrl}:`, err);
  
  const statusCode = err.statusCode || 500;
  const userMessage = err.isPublic ? err.message : (statusCode === 500 ? 'An unexpected error occurred. Please try again.' : err.message);
  
  res.status(statusCode).json({
    error: userMessage,
    status: 'ERROR',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
