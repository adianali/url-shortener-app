const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/database', () => ({
  url: {
    findFirst: jest.fn(),
  },
  click: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  $on: jest.fn(),
}));

jest.mock('../src/config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
}));

const app = require('../src/app');
const prisma = require('../src/config/database');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';

function makeToken(payload = { id: 'user-1', email: 'test@example.com' }) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

describe('Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/urls/:id/analytics', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/urls/url-1/analytics');
      expect(res.status).toBe(401);
    });

    it('should return analytics for owned URL', async () => {
      prisma.url.findFirst.mockResolvedValue({ id: 'url-1', userId: 'user-1' });
      prisma.click.count.mockResolvedValue(100);
      prisma.click.groupBy.mockResolvedValue([]);

      const token = makeToken();
      const res = await request(app)
        .get('/api/urls/url-1/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalClicks');
    });

    it('should return 404 if URL not owned by user', async () => {
      prisma.url.findFirst.mockResolvedValue(null);

      const token = makeToken();
      const res = await request(app)
        .get('/api/urls/url-99/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('URL_NOT_FOUND');
    });
  });

  describe('GET /api/urls/:id/analytics/clicks', () => {
    it('should return paginated clicks', async () => {
      prisma.url.findFirst.mockResolvedValue({ id: 'url-1', userId: 'user-1' });
      prisma.click.findMany.mockResolvedValue([
        {
          id: 'click-1', ip: '1.2.3.4', country: 'US', city: 'NYC',
          device: 'desktop', browser: 'Chrome', os: 'Windows',
          referer: null, createdAt: new Date(),
        },
      ]);
      prisma.click.count.mockResolvedValue(1);

      const token = makeToken();
      const res = await request(app)
        .get('/api/urls/url-1/analytics/clicks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });
  });

  describe('GET /api/urls/:id/analytics/summary', () => {
    it('should return summary stats', async () => {
      prisma.url.findFirst.mockResolvedValue({ id: 'url-1', userId: 'user-1' });
      prisma.click.count.mockResolvedValue(42);
      prisma.click.groupBy.mockResolvedValue([]);

      const token = makeToken();
      const res = await request(app)
        .get('/api/urls/url-1/analytics/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('last24h');
      expect(res.body.data).toHaveProperty('last7d');
      expect(res.body.data).toHaveProperty('last30d');
    });
  });
});
