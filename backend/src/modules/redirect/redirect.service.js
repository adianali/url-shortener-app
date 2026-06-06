const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const redis = require('../../config/redis');
const { getGeoIP } = require('../../utils/getGeoIP');
const { parseUserAgent } = require('../../utils/parseUserAgent');
const { getClientIp } = require('../../middlewares/rateLimiter');
const logger = require('../../utils/logger');

const CACHE_TTL = 3600;

/**
 * Ambil URL dari Redis cache atau database.
 * Hanya URL yang belum soft-deleted (deletedAt: null).
 */
async function getUrlBySlug(slug) {
  // 1. Coba Redis cache
  const cached = await redis.get(`url:${slug}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Query DB — hanya yang belum dihapus
  const url = await prisma.url.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      originalUrl: true,
      password: true,
      expiresAt: true,
      // deletedAt tidak perlu di-cache; filter sudah di atas
    },
  });

  if (url) {
    // Simpan ke cache (termasuk password agar verifyPassword bisa cek dari cache)
    await redis.setex(`url:${slug}`, CACHE_TTL, JSON.stringify(url));
  }

  return url;
}

/**
 * Catat klik secara async (fire-and-forget).
 * createdBy diisi IP sebagai identifier sistem.
 */
async function recordClick(urlId, req) {
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const referer = req.headers.referer || req.headers.referrer || null;

  const [geo, parsed] = await Promise.all([
    getGeoIP(ip),
    Promise.resolve(parseUserAgent(ua)),
  ]);

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
      createdBy: ip, // system-generated; IP sebagai identifier
    },
  });
}

/**
 * Proses redirect:
 * 1. Cek cache / DB
 * 2. Validasi expire & soft-delete
 * 3. Cek password protection
 * 4. Fire-and-forget click
 */
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

  if (url.password) {
    return { requiresPassword: true, slug };
  }

  // Catat klik — jangan await agar redirect tetap cepat
  recordClick(url.id, req).catch((err) =>
    logger.error('Failed to record click:', err)
  );

  return { redirectTo: url.originalUrl };
}

/**
 * Verifikasi password untuk URL yang diproteksi.
 */
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
    // Tidak ada password, langsung redirect
    recordClick(url.id, req).catch((err) =>
      logger.error('Failed to record click:', err)
    );
    return { redirectTo: url.originalUrl };
  }

  const valid = await bcrypt.compare(password, url.password);
  if (!valid) {
    const err = new Error('Wrong password');
    err.code = 'URL_WRONG_PASSWORD';
    throw err;
  }

  recordClick(url.id, req).catch((err) =>
    logger.error('Failed to record click:', err)
  );

  return { redirectTo: url.originalUrl };
}

module.exports = { redirect, verifyPassword, recordClick };
