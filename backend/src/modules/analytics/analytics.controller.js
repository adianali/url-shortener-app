const analyticsService = require('./analytics.service');

async function getAnalytics(req, res, next) {
  try {
    const period = req.query.period || '7d';
    const data = await analyticsService.getAnalytics(req.params.id, req.user.id, period);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getClicks(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const result = await analyticsService.getClicks(req.params.id, req.user.id, page, limit);
    res.json({ success: true, data: result.clicks, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const data = await analyticsService.getSummary(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics, getClicks, getSummary };
