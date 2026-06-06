const { Router } = require('express');
const controller = require('./url.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { createUrlRateLimiter } = require('../../middlewares/rateLimiter');
const { createUrlSchema, updateUrlSchema, getUrlSchema } = require('./url.schema');

const router = Router();

/**
 * @swagger
 * /api/urls:
 *   post:
 *     summary: Create a short URL (auth optional)
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalUrl]
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *               slug:
 *                 type: string
 *               password:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: URL created successfully
 *       409:
 *         description: Slug already taken
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', authenticate(false), createUrlRateLimiter(), validate(createUrlSchema), controller.createUrl);

/**
 * @swagger
 * /api/urls:
 *   get:
 *     summary: List all URLs for the authenticated user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of URLs
 *       401:
 *         description: Authentication required
 */
router.get('/', authenticate(true), controller.listUrls);

/**
 * @swagger
 * /api/urls/{id}:
 *   get:
 *     summary: Get a URL by ID
 *     tags: [URLs]
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
 *         description: URL details
 *       404:
 *         description: URL not found
 */
router.get('/:id', authenticate(true), validate(getUrlSchema), controller.getUrlById);

/**
 * @swagger
 * /api/urls/{id}:
 *   patch:
 *     summary: Update a URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *               password:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: URL updated
 *       404:
 *         description: URL not found
 */
router.patch('/:id', authenticate(true), validate(updateUrlSchema), controller.updateUrl);

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     summary: Soft delete a URL
 *     tags: [URLs]
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
 *         description: URL deleted
 *       404:
 *         description: URL not found
 */
router.delete('/:id', authenticate(true), validate(getUrlSchema), controller.deleteUrl);

module.exports = router;
