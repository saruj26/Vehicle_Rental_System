import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let error = err;

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`${field} already exists`);
  }

  // Mongoose: validation
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
  }

  // Multer
  if (err.code === 'LIMIT_FILE_SIZE') error = ApiError.badRequest('File too large');
  if (err.code === 'LIMIT_UNEXPECTED_FILE') error = ApiError.badRequest('Too many files or wrong field');

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || 'Internal server error',
    ...(error.details ? { details: error.details } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  };

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('💥', err);
  }

  res.status(statusCode).json(payload);
}
