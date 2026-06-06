const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(user) {
  const payload = { id: user.id, email: user.email };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  return { accessToken, refreshToken };
}

function getRefreshExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
}

/**
 * Register user baru.
 * createdBy diisi email itu sendiri (self-register).
 */
async function register(email, password) {
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (existing) {
    const err = new Error('Email already registered');
    err.code = 'AUTH_INVALID_CREDENTIALS';
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      createdBy: email, // self-register
    },
    select: { id: true, email: true, createdAt: true, createdBy: true },
  });

  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshExpiry(),
      createdBy: email,
    },
  });

  return { user, accessToken, refreshToken };
}

/**
 * Login — hanya user yang belum soft-deleted.
 */
async function login(email, password) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.code = 'AUTH_INVALID_CREDENTIALS';
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.code = 'AUTH_INVALID_CREDENTIALS';
    throw err;
  }

  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshExpiry(),
      createdBy: email,
    },
  });

  const { password: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

/**
 * Refresh token — rotate token, catat updatedBy.
 * Soft-delete token lama (set deletedAt) daripada hard delete.
 */
async function refresh(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_SECRET);
  } catch {
    const e = new Error('Invalid or expired refresh token');
    e.code = 'AUTH_TOKEN_EXPIRED';
    throw e;
  }

  // Cari token yang masih aktif (belum soft-deleted)
  const storedToken = await prisma.refreshToken.findFirst({
    where: { token, deletedAt: null },
  });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    const err = new Error('Refresh token not found or expired');
    err.code = 'AUTH_TOKEN_EXPIRED';
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: { id: decoded.id, deletedAt: null },
  });
  if (!user) {
    const err = new Error('User not found');
    err.code = 'AUTH_UNAUTHORIZED';
    throw err;
  }

  // Soft-delete token lama (rotate)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      deletedAt: new Date(),
      deletedBy: user.email,
      updatedBy: user.email,
    },
  });

  // Buat token baru
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: getRefreshExpiry(),
      createdBy: user.email,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

/**
 * Logout — soft-delete refresh token (bukan hard delete).
 */
async function logout(token, actorEmail) {
  await prisma.refreshToken.updateMany({
    where: { token, deletedAt: null },
    data: {
      deletedAt: new Date(),
      deletedBy: actorEmail || 'system',
      updatedBy: actorEmail || 'system',
    },
  });
}

module.exports = { register, login, refresh, logout };
