const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;

if (process.env.NODE_ENV === 'test') {
  // In test environment, return a mock redis client
  const mockRedis = {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 1,
    incr: async () => 1,
    expire: async () => 1,
    ttl: async () => -1,
    quit: async () => 'OK',
  };
  redis = mockRedis;
} else {
  if (!process.env.REDIS_URL) throw new Error('Missing required env: REDIS_URL');
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error('Redis error:', err));
}

module.exports = redis;
