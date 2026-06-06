const { Router } = require('express');
const controller = require('./redirect.controller');

const router = Router();

/**
 * @swagger
 * /{slug}:
 *   get:
 *     summary: Redirect to the original URL
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       301:
 *         description: Redirect to original URL
 *       200:
 *         description: URL is password protected
 *       404:
 *         description: URL not found
 *       410:
 *         description: URL expired
 */
router.get('/:slug', controller.handleRedirect);

/**
 * @swagger
 * /{slug}/verify:
 *   post:
 *     summary: Verify password for a protected URL
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password verified, returns redirect URL
 *       403:
 *         description: Wrong password
 */
router.post('/:slug/verify', controller.handleVerifyPassword);

module.exports = router;
