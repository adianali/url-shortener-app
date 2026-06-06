const { z } = require('zod');

const createUrlSchema = z.object({
  body: z.object({
    originalUrl: z.string().url('Must be a valid URL'),
    slug: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Slug must be alphanumeric').optional(),
    password: z.string().min(4).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  }),
});

const updateUrlSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    originalUrl: z.string().url('Must be a valid URL').optional(),
    password: z.string().min(4).optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const getUrlSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

module.exports = { createUrlSchema, updateUrlSchema, getUrlSchema };
