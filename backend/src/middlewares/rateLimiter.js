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
    // Fail open on Redis errors
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

// Global: 100 req / 15min per IP
function globalRateLimiter() {
  return async (req, res, next) => {
    const ip = getClientIp(req);
    const key = `ratelimit:${ip}`;
    const { allowed, current, limit } = await checkRateLimit(key, 100, 15 * 60);

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

// Create URL rate limiter: 5/hour (no auth) or 50/hour (auth)
function createUrlRateLimiter() {
  return async (req, res, next) => {
    const ip = getClientIp(req);
    let key;
    let limit;

    if (req.user) {
      key = `ratelimit:user:${req.user.id}`;
      limit = 50;
    } else {
      key = `ratelimit:create:${ip}`;
      limit = 5;
    }

    const { allowed, current } = await checkRateLimit(key, limit, 3600);

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
