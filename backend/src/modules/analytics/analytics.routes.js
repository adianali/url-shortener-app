const { Router } = require('express');
const controller = require('./analytics.controller');
const { authenticate } = require('../../middlewares/auth');

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/urls/{id}/analytics:
 *   get:
 *     summary: Get full analytics for a URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data
 *       404:
 *         description: URL not found
 */
router.get('/', authenticate(true), controller.getAnalytics);

/**
 * @swagger
 * /api/urls/{id}/analytics/clicks:
 *   get:
 *     summary: Get paginated click events for a URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Click events
 */
router.get('/clicks', authenticate(true), controller.getClicks);

/**
 * @swagger
 * /api/urls/{id}/analytics/summary:
 *   get:
 *     summary: Get summary analytics for a URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get('/summary', authenticate(true), controller.getSummary);

module.exports = router;
