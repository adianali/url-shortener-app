const prisma = require('../../config/database');

// Hanya klik yang belum soft-deleted
const ACTIVE_CLICK = { deletedAt: null };

async function verifyUrlOwnership(urlId, userId) {
  const url = await prisma.url.findFirst({
    where: { id: urlId, userId, deletedAt: null },
  });
  if (!url) {
    const err = new Error('URL not found');
    err.code = 'URL_NOT_FOUND';
    throw err;
  }
  return url;
}

async function getAnalytics(urlId, userId) {
  await verifyUrlOwnership(urlId, userId);

  const where = { urlId, ...ACTIVE_CLICK };

  const [totalClicks, uniqueVisitors, byCountry, byDevice, byBrowser, byOs] =
    await Promise.all([
      prisma.click.count({ where }),
      // Unique visitor berdasarkan IP
      prisma.click.groupBy({ by: ['ip'], where }).then((r) => r.length),
      prisma.click.groupBy({
        by: ['country'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.click.groupBy({
        by: ['device'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.click.groupBy({
        by: ['browser'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.click.groupBy({
        by: ['os'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

  return {
    totalClicks,
    uniqueVisitors,
    byCountry: byCountry.map((r) => ({ country: r.country, clicks: r._count.id })),
    byDevice: byDevice.map((r) => ({ device: r.device, clicks: r._count.id })),
    byBrowser: byBrowser.map((r) => ({ browser: r.browser, clicks: r._count.id })),
    byOs: byOs.map((r) => ({ os: r.os, clicks: r._count.id })),
  };
}

async function getClicks(urlId, userId, page = 1, limit = 50) {
  await verifyUrlOwnership(urlId, userId);

  const where = { urlId, ...ACTIVE_CLICK };
  const skip = (page - 1) * limit;

  const [clicks, total] = await Promise.all([
    prisma.click.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        ip: true,
        country: true,
        city: true,
        device: true,
        browser: true,
        os: true,
        referer: true,
        createdAt: true,
        createdBy: true,
      },
    }),
    prisma.click.count({ where }),
  ]);

  return {
    clicks,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getSummary(urlId, userId) {
  await verifyUrlOwnership(urlId, userId);

  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const where = { urlId, ...ACTIVE_CLICK };

  const [total, last24hCount, last7dCount, last30dCount, topReferers] =
    await Promise.all([
      prisma.click.count({ where }),
      prisma.click.count({ where: { ...where, createdAt: { gte: last24h } } }),
      prisma.click.count({ where: { ...where, createdAt: { gte: last7d } } }),
      prisma.click.count({ where: { ...where, createdAt: { gte: last30d } } }),
      prisma.click.groupBy({
        by: ['referer'],
        where: { ...where, referer: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

  return {
    total,
    last24h: last24hCount,
    last7d: last7dCount,
    last30d: last30dCount,
    topReferers: topReferers.map((r) => ({ referer: r.referer, clicks: r._count.id })),
  };
}

module.exports = { getAnalytics, getClicks, getSummary };
