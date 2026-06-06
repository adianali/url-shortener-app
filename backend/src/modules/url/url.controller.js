const urlService = require('./url.service');

async function createUrl(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const actorEmail = req.user ? req.user.email : null;
    const url = await urlService.createUrl(req.body, userId, actorEmail);
    const shortUrl = `${process.env.BASE_URL}/${url.slug}`;
    res.status(201).json({ success: true, data: { ...url, shortUrl } });
  } catch (err) {
    next(err);
  }
}

async function listUrls(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const filter = req.query.filter || null; // 'active' | 'expired'
    const result = await urlService.listUrls(req.user.id, { page, limit, filter });
    res.json({ success: true, data: result.urls, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

async function getUrlById(req, res, next) {
  try {
    const url = await urlService.getUrlById(req.params.id, req.user.id);
    res.json({ success: true, data: url });
  } catch (err) {
    next(err);
  }
}

async function updateUrl(req, res, next) {
  try {
    const actorEmail = req.user ? req.user.email : null;
    const url = await urlService.updateUrl(req.params.id, req.user.id, req.body, actorEmail);
    res.json({ success: true, data: url });
  } catch (err) {
    next(err);
  }
}

async function deleteUrl(req, res, next) {
  try {
    const actorEmail = req.user ? req.user.email : null;
    await urlService.deleteUrl(req.params.id, req.user.id, actorEmail);
    res.json({ success: true, data: { message: 'URL deleted successfully (soft delete)' } });
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const data = await urlService.getDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUrl, listUrls, getUrlById, updateUrl, deleteUrl, getDashboard };
