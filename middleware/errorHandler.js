// Error handling middleware
import { formatErrorMessage } from '../lib/utils.js';

export function errorHandler(error, req, res, next) {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = error.message;
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = error.message;
    code = 'CONFLICT';
  } else if (error.message) {
    // Use the error message if available
    message = formatErrorMessage(error);
  }

  // Handle database errors
  if (error.message && error.message.includes('Database')) {
    statusCode = 500;
    code = 'DATABASE_ERROR';
  }

  // Handle LINE API errors
  if (error.message && error.message.includes('LINE')) {
    statusCode = 502;
    code = 'LINE_API_ERROR';
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    statusCode = 504;
    message = 'Request timeout';
    code = 'TIMEOUT';
  }

  const errorResponse = {
    success: false,
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  };

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  return res.status(statusCode).json(errorResponse);
}

export function createError(message, statusCode = 500, code = 'ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function createValidationError(message) {
  return createError(message, 400, 'VALIDATION_ERROR');
}

export function createNotFoundError(message = 'Resource not found') {
  return createError(message, 404, 'NOT_FOUND');
}

export function createUnauthorizedError(message = 'Unauthorized') {
  return createError(message, 401, 'UNAUTHORIZED');
}

export function createConflictError(message) {
  return createError(message, 409, 'CONFLICT');
}
