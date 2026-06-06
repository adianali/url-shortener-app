const request = require('supertest');

// CATATAN: variabel dalam jest.mock() factory harus diawali "mock" (case-insensitive)
// agar bisa diakses karena jest.mock() di-hoist ke atas scope.
let mockIncrCounter = 0;

jest.mock('../src/config/database', () => ({
  url: { findFirst: jest.fn(), create: jest.fn() },
  $on: jest.fn(),
}));

jest.mock('../src/config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockImplementation(() => {
    mockIncrCounter++;
    return Promise.resolve(mockIncrCounter);
  }),
  expire: jest.fn().mockResolvedValue(1),
}));

const app = require('../src/app');
const redis = require('../src/config/redis');

describe('Rate Limiter', () => {
  beforeEach(() => {
    mockIncrCounter = 0;
    jest.clearAllMocks();
    redis.incr.mockImplementation(() => {
      mockIncrCounter++;
      return Promise.resolve(mockIncrCounter);
    });
  });

  it('should allow request when under global rate limit', async () => {
    // incr return 1 = masih dalam limit 100
    redis.incr.mockResolvedValue(1);

    const res = await request(app).get('/health');
    // /health tidak kena global rate limiter (/api/*)
    expect(res.status).toBe(200);
  });

  it('should return 429 on /api routes when over global limit', async () => {
    // Simulasi: incr return > 100 = limit terlampaui
    redis.incr.mockResolvedValue(101);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should return 429 when URL creation rate limit exceeded', async () => {
    // Global check = 1 (allowed), create URL check = 6 (exceeded, limit 5/jam)
    redis.incr
      .mockResolvedValueOnce(1)  // global rate limit: lolos
      .mockResolvedValueOnce(6); // create url rate limit: exceeded

    const res = await request(app).post('/api/urls').send({
      originalUrl: 'https://example.com',
    });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
