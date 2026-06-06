/**
 * Jest setup — inject env vars yang dibutuhkan app agar tidak throw saat test.
 * Nilai ini hanya dipakai di test environment; production pakai .env sungguhan.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.BASE_URL = 'http://localhost:3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.GEOIP_API_URL = 'http://ip-api.com/json';
process.env.ALLOWED_ORIGINS = 'http://localhost:3001,http://localhost:5173';
