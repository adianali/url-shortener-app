const crypto = require('crypto');
const prisma = require('../config/database');

const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SLUG_LENGTH = 6;
const RESERVED_WORDS = new Set(['api', 'admin', 'health', 'docs']);

function generateRandomSlug() {
  const bytes = crypto.randomBytes(SLUG_LENGTH);
  let slug = '';
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += BASE62_CHARS[bytes[i] % 62];
  }
  return slug;
}

async function generateUniqueSlug(customSlug) {
  if (customSlug) {
    if (RESERVED_WORDS.has(customSlug.toLowerCase())) {
      const err = new Error('Slug is a reserved word');
      err.code = 'URL_SLUG_TAKEN';
      throw err;
    }
    const existing = await prisma.url.findUnique({ where: { slug: customSlug } });
    if (existing) {
      const err = new Error('Slug already taken');
      err.code = 'URL_SLUG_TAKEN';
      throw err;
    }
    return customSlug;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = generateRandomSlug();
    if (RESERVED_WORDS.has(slug.toLowerCase())) continue;
    const existing = await prisma.url.findUnique({ where: { slug } });
    if (!existing) return slug;
  }

  throw new Error('Failed to generate unique slug after max attempts');
}

module.exports = { generateUniqueSlug, generateRandomSlug };
