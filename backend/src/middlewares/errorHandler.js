const { ZodError } = require('zod');
const logger = require('../utils/logger');

const ERROR_MAP = {
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_EMAIL_NOT_FOUND: 401,
  AUTH_WRONG_PASSWORD: 401,
  AUTH_EMAIL_TAKEN: 409,
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_UNAUTHORIZED: 403,
  URL_NOT_FOUND: 404,
  URL_EXPIRED: 410,
  URL_WRONG_PASSWORD: 403,
  URL_SLUG_TAKEN: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
};

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'URL_SLUG_TAKEN',
        message: 'A record with this value already exists',
      },
    });
  }

  if (err.code && ERROR_MAP[err.code]) {
    return res.status(ERROR_MAP[err.code]).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  logger.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}

module.exports = errorHandler;
