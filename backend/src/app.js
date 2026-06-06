const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const { globalRateLimiter } = require('./middlewares/rateLimiter');

const authRoutes = require('./modules/auth/auth.routes');
const urlRoutes = require('./modules/url/url.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const redirectRoutes = require('./modules/redirect/redirect.routes');
const urlController = require('./modules/url/url.controller');
const { authenticate } = require('./middlewares/auth');

const app = express();

// Security
app.use(helmet());

// CORS
if (!process.env.ALLOWED_ORIGINS) throw new Error('Missing required env: ALLOWED_ORIGINS');
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// Global rate limiter (skip redirect routes)
app.use(/^\/api/, globalRateLimiter());

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/urls/:id/analytics', analyticsRoutes);

// Dashboard
/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard stats for the authenticated user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
app.get('/api/dashboard', authenticate(true), urlController.getDashboard);

// Redirect routes (must be last to avoid conflicts with /api/*)
app.use('/', redirectRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'URL_NOT_FOUND', message: 'Route not found' },
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
