const prisma = require('../../config/database');

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

// Generate array tanggal dari N hari terakhir
function buildDateRange(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
  }
  return dates;
}

async function getAnalytics(urlId, userId, period = '7d') {
  await verifyUrlOwnership(urlId, userId);

  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const where = { urlId, ...ACTIVE_CLICK };
  const wherePeriod = { ...where, createdAt: { gte: since } };

  const [
    totalClicks,
    uniqueIps,
    byCountry,
    byDevice,
    byBrowser,
    byOs,
    byReferer,
    clicksInPeriod,
  ] = await Promise.all([
    prisma.click.count({ where }),
    prisma.click.groupBy({ by: ['ip'], where }),
    prisma.click.groupBy({ by: ['country'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
    prisma.click.groupBy({ by: ['device'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.click.groupBy({ by: ['browser'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.click.groupBy({ by: ['os'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.click.groupBy({
      by: ['referer'],
      where: { ...where, referer: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    prisma.click.findMany({
      where: wherePeriod,
      select: { createdAt: true },
    }),
  ]);

  // Build time series: group klik by tanggal, fill hari kosong dengan 0
  const countByDate = {};
  clicksInPeriod.forEach((c) => {
    const day = c.createdAt.toISOString().slice(0, 10);
    countByDate[day] = (countByDate[day] || 0) + 1;
  });
  const timeSeries = buildDateRange(days).map((date) => ({
    date,
    clicks: countByDate[date] || 0,
  }));

  return {
    totalClicks,
    uniqueVisitors: uniqueIps.length,
    timeSeries,
    devices: byDevice.map((r) => ({ name: r.device || 'unknown', value: r._count.id })),
    browsers: byBrowser.map((r) => ({ name: r.browser || 'unknown', value: r._count.id })),
    os: byOs.map((r) => ({ name: r.os || 'unknown', value: r._count.id })),
    countries: byCountry.map((r) => ({ name: r.country || 'Unknown', value: r._count.id })),
    referrers: byReferer.map((r) => ({ name: r.referer, value: r._count.id })),
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

  const [totalClicks, uniqueIps, last24hCount, last7dCount, last30dCount, topReferers] =
    await Promise.all([
      prisma.click.count({ where }),
      prisma.click.groupBy({ by: ['ip'], where }),
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
    totalClicks,
    uniqueVisitors: uniqueIps.length,
    last24h: last24hCount,
    last7d: last7dCount,
    last30d: last30dCount,
    topReferers: topReferers.map((r) => ({ referer: r.referer, clicks: r._count.id })),
  };
}

module.exports = { getAnalytics, getClicks, getSummary };
