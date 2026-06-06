const request = require('supertest');

jest.mock('../src/config/database', () => ({
  url: {
    findFirst: jest.fn(), // service pakai findFirst (filter deletedAt: null)
  },
  click: {
    create: jest.fn(),
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

// Mock GeoIP agar tidak ada external call
jest.mock('../src/utils/getGeoIP', () => ({
  getGeoIP: jest.fn().mockResolvedValue({ country: 'Local', city: null }),
}));

const app = require('../src/app');
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

describe('Redirect API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../src/config/redis').get.mockResolvedValue(null);
  });

  describe('GET /:slug', () => {
    it('should redirect to the original URL', async () => {
      prisma.url.findFirst.mockResolvedValue({
        id: 'url-1',
        slug: 'abc123',
        originalUrl: 'https://example.com',
        password: null,
        expiresAt: null,
        deletedAt: null,
      });
      prisma.click.create.mockResolvedValue({});

      const res = await request(app).get('/abc123');
      expect(res.status).toBe(301);
      expect(res.headers.location).toBe('https://example.com');
    });

    it('should return 404 for non-existent slug', async () => {
      prisma.url.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('URL_NOT_FOUND');
    });

    it('should return 410 for expired URL', async () => {
      prisma.url.findFirst.mockResolvedValue({
        id: 'url-1',
        slug: 'expired',
        originalUrl: 'https://example.com',
        password: null,
        expiresAt: new Date('2000-01-01'),
        deletedAt: null,
      });

      const res = await request(app).get('/expired');
      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('URL_EXPIRED');
    });

    it('should return 200 with requiresPassword for protected URL', async () => {
      prisma.url.findFirst.mockResolvedValue({
        id: 'url-1',
        slug: 'protected',
        originalUrl: 'https://example.com',
        password: 'hashedpassword',
        expiresAt: null,
        deletedAt: null,
      });

      const res = await request(app).get('/protected');
      expect(res.status).toBe(200);
      expect(res.body.data.requiresPassword).toBe(true);
    });

    it('should return 404 for soft-deleted URL', async () => {
      // URL yang sudah soft-deleted tidak akan ditemukan (query filter deletedAt: null)
      prisma.url.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/inactive');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /:slug/verify', () => {
    it('should redirect after correct password', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      prisma.url.findFirst.mockResolvedValue({
        id: 'url-1',
        slug: 'protected',
        originalUrl: 'https://example.com',
        password: hashed,
        expiresAt: null,
        deletedAt: null,
      });
      prisma.click.create.mockResolvedValue({});

      const res = await request(app)
        .post('/protected/verify')
        .send({ password: 'secret' });

      expect(res.status).toBe(200);
      expect(res.body.data.redirectTo).toBe('https://example.com');
    });

    it('should return 403 for wrong password', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      prisma.url.findFirst.mockResolvedValue({
        id: 'url-1',
        slug: 'protected',
        originalUrl: 'https://example.com',
        password: hashed,
        expiresAt: null,
        deletedAt: null,
      });

      const res = await request(app)
        .post('/protected/verify')
        .send({ password: 'wrong' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('URL_WRONG_PASSWORD');
    });

    it('should return 422 when password field is missing', async () => {
      const res = await request(app).post('/protected/verify').send({});
      expect(res.status).toBe(422);
    });
  });
});
