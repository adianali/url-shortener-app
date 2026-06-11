const redis = require('../config/redis');
const logger = require('../utils/logger');

async function checkRateLimit(key, limit, windowSeconds) {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return { allowed: current <= limit, current, limit };
  } catch (err) {
    logger.error('Rate limiter Redis error:', err);
    return { allowed: true, current: 0, limit };
  }
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function globalRateLimiter() {
  return async (req, res, next) => {
    const ip = getClientIp(req);
    const { allowed, current, limit } = await checkRateLimit(`ratelimit:${ip}`, 100, 15 * 60);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));

    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' },
      });
    }
    next();
  };
}

function createUrlRateLimiter() {
  return async (req, res, next) => {
    const ip = getClientIp(req);
    const key = req.user ? `ratelimit:user:${req.user.id}` : `ratelimit:create:${ip}`;
    const limit = req.user ? 50 : 5;

    const { allowed } = await checkRateLimit(key, limit, 3600);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'URL creation limit exceeded' },
      });
    }
    next();
  };
}

module.exports = { globalRateLimiter, createUrlRateLimiter, getClientIp };
