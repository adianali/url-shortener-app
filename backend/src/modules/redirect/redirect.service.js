const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const redis = require('../../config/redis');
const { getGeoIP } = require('../../utils/getGeoIP');
const { parseUserAgent } = require('../../utils/parseUserAgent');
const { getClientIp } = require('../../middlewares/rateLimiter');
const logger = require('../../utils/logger');

const CACHE_TTL = 3600;

async function getUrlBySlug(slug) {
  const cached = await redis.get(`url:${slug}`);
  if (cached) return JSON.parse(cached);

  const url = await prisma.url.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, slug: true, originalUrl: true, password: true, expiresAt: true },
  });

  if (url) await redis.setex(`url:${slug}`, CACHE_TTL, JSON.stringify(url));
  return url;
}

async function recordClick(urlId, req) {
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const referer = req.headers.referer || req.headers.referrer || null;

  const [geo, parsed] = await Promise.all([getGeoIP(ip), Promise.resolve(parseUserAgent(ua))]);

  await prisma.click.create({
    data: {
      urlId,
      ip,
      country: geo.country,
      city: geo.city,
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      referer,
      userAgent: ua,
      createdBy: ip,
    },
  });
}

async function redirect(slug, req) {
  const url = await getUrlBySlug(slug);

  if (!url) {
    const err = new Error('URL not found');
    err.code = 'URL_NOT_FOUND';
    throw err;
  }

  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    const err = new Error('URL has expired');
    err.code = 'URL_EXPIRED';
    throw err;
  }

  if (url.password) return { requiresPassword: true, slug };

  recordClick(url.id, req).catch((err) => logger.error('Failed to record click:', err));
  return { redirectTo: url.originalUrl };
}

async function verifyPassword(slug, password, req) {
  const url = await getUrlBySlug(slug);

  if (!url) {
    const err = new Error('URL not found');
    err.code = 'URL_NOT_FOUND';
    throw err;
  }

  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    const err = new Error('URL has expired');
    err.code = 'URL_EXPIRED';
    throw err;
  }

  if (!url.password) {
    recordClick(url.id, req).catch((err) => logger.error('Failed to record click:', err));
    return { redirectTo: url.originalUrl };
  }

  const valid = await bcrypt.compare(password, url.password);
  if (!valid) {
    const err = new Error('Wrong password');
    err.code = 'URL_WRONG_PASSWORD';
    throw err;
  }

  recordClick(url.id, req).catch((err) => logger.error('Failed to record click:', err));
  return { redirectTo: url.originalUrl };
}

module.exports = { redirect, verifyPassword, recordClick };
