const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const redis = require('../../config/redis');
const { generateUniqueSlug } = require('../../utils/generateSlug');
const { validateUrl } = require('../../utils/validateUrl');

const CACHE_TTL = 3600; // 1 jam

// ── Helpers cache ────────────────────────────────────────────────────────────

async function cacheUrl(slug, url) {
  await redis.setex(`url:${slug}`, CACHE_TTL, JSON.stringify(url));
}

async function getCachedUrl(slug) {
  const cached = await redis.get(`url:${slug}`);
  return cached ? JSON.parse(cached) : null;
}

async function invalidateCache(slug) {
  await redis.del(`url:${slug}`);
}

// ── Select set yang aman (tanpa password) ────────────────────────────────────

const URL_SELECT = {
  id: true,
  slug: true,
  originalUrl: true,
  userId: true,
  expiresAt: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  deletedAt: true,
  deletedBy: true,
  _count: { select: { clicks: true } },
};

// Filter: URL yang belum di-soft-delete
const ACTIVE_FILTER = { deletedAt: null };

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Buat short URL baru.
 * @param {object} data
 * @param {string|null} userId
 * @param {string|null} actorEmail  — email user yang membuat (untuk createdBy)
 */
async function createUrl(data, userId, actorEmail) {
  const { originalUrl, slug: customSlug, password, expiresAt } = data;

  const { valid, message } = validateUrl(originalUrl);
  if (!valid) {
    const err = new Error(message);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const slug = await generateUniqueSlug(customSlug);

  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const url = await prisma.url.create({
    data: {
      slug,
      originalUrl,
      userId: userId || null,
      password: hashedPassword,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: actorEmail || null,
    },
    select: URL_SELECT,
  });

  // Cache tanpa password
  await cacheUrl(slug, { ...url, password: undefined });
  return url;
}

/**
 * List URL milik user — hanya yang belum di-soft-delete.
 */
async function listUrls(userId, { page = 1, limit = 20, filter } = {}) {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...ACTIVE_FILTER,
    ...(filter === 'expired'
      ? { expiresAt: { lt: new Date() } }
      : filter === 'active'
      ? { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }
      : {}),
  };

  const [urls, total] = await Promise.all([
    prisma.url.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: URL_SELECT,
    }),
    prisma.url.count({ where }),
  ]);

  return {
    urls,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Detail satu URL — hanya milik userId dan belum dihapus.
 */
async function getUrlById(id, userId) {
  const url = await prisma.url.findFirst({
    where: { id, userId, ...ACTIVE_FILTER },
    select: URL_SELECT,
  });

  if (!url) {
    const err = new Error('URL not found');
    err.code = 'URL_NOT_FOUND';
    throw err;
  }

  return url;
}

/**
 * Update URL.
 * Catat updatedBy dari actorEmail.
 */
async function updateUrl(id, userId, data, actorEmail) {
  const url = await prisma.url.findFirst({
    where: { id, userId, ...ACTIVE_FILTER },
  });
  if (!url) {
    const err = new Error('URL not found');
    err.code = 'URL_NOT_FOUND';
    throw err;
  }

  if (data.originalUrl) {
    const { valid, message } = validateUrl(data.originalUrl);
    if (!valid) {
      const err = new Error(message);
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  const updateData = { updatedBy: actorEmail || null };
  if (data.originalUrl !== undefined) updateData.originalUrl = data.originalUrl;
  if (data.expiresAt !== undefined)
    updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.password !== undefined) {
    updateData.password = data.password ? await bcrypt.hash(data.password, 10) : null;
  }

  const updated = await prisma.url.update({
    where: { id },
    data: updateData,
    select: URL_SELECT,
  });

  await invalidateCache(url.slug);
  return updated;
}

/**
 * Soft delete URL — set deletedAt & deletedBy, jangan hapus dari DB.
 */
async function deleteUrl(id, userId, actorEmail) {
  const url = await prisma.url.findFirst({
    where: { id, userId, ...ACTIVE_FILTER },
  });
  if (!url) {
    const err = new Error('URL not found');
    err.code = 'URL_NOT_FOUND';
    throw err;
  }

  await prisma.url.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: actorEmail || 'system',
      updatedBy: actorEmail || 'system',
    },
  });

  await invalidateCache(url.slug);
}

/**
 * Dashboard statistik akun.
 */
async function getDashboard(userId) {
  const [totalUrls, totalClicks, recentUrls] = await Promise.all([
    prisma.url.count({ where: { userId, ...ACTIVE_FILTER } }),
    prisma.click.count({
      where: { url: { userId }, deletedAt: null },
    }),
    prisma.url.findMany({
      where: { userId, ...ACTIVE_FILTER },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        _count: { select: { clicks: true } },
      },
    }),
  ]);

  return { totalUrls, totalClicks, recentUrls };
}

module.exports = {
  createUrl,
  listUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
  getDashboard,
  cacheUrl,
  getCachedUrl,
};
