const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/database', () => ({
  url: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  click: {
    count: jest.fn(),
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

describe('URL API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/urls (no auth)', () => {
    it('should create a URL without authentication', async () => {
      prisma.url.findUnique.mockResolvedValue(null);
      prisma.url.create.mockResolvedValue({
        id: 'url-1',
        slug: 'abc123',
        originalUrl: 'https://example.com',
        userId: null,
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post('/api/urls').send({
        originalUrl: 'https://example.com',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('slug');
      expect(res.body.data).toHaveProperty('shortUrl');
    });

    it('should create a URL with authentication', async () => {
      prisma.url.findUnique.mockResolvedValue(null);
      prisma.url.create.mockResolvedValue({
        id: 'url-2',
        slug: 'myslug',
        originalUrl: 'https://example.com/page',
        userId: 'user-1',
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const token = makeToken();
      const res = await request(app)
        .post('/api/urls')
        .set('Authorization', `Bearer ${token}`)
        .send({ originalUrl: 'https://example.com/page', slug: 'myslug' });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('myslug');
    });

    it('should reject invalid URLs', async () => {
      const res = await request(app).post('/api/urls').send({
        originalUrl: 'not-a-url',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject localhost URLs', async () => {
      const res = await request(app).post('/api/urls').send({
        originalUrl: 'http://localhost:8080/secret',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when custom slug is taken', async () => {
      // findUnique returns existing URL (slug taken)
      prisma.url.findUnique.mockResolvedValue({ id: 'existing', slug: 'taken' });

      const res = await request(app).post('/api/urls').send({
        originalUrl: 'https://example.com',
        slug: 'taken',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/urls (auth required)', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/urls');
      expect(res.status).toBe(401);
    });

    it('should return list of URLs for authenticated user', async () => {
      prisma.url.findMany.mockResolvedValue([
        { id: 'url-1', slug: 'abc', originalUrl: 'https://example.com', _count: { clicks: 5 } },
      ]);
      prisma.url.count.mockResolvedValue(1);

      const token = makeToken();
      const res = await request(app).get('/api/urls').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });
  });
});
