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
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function register(email, password) {
  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) {
    const err = new Error('Email sudah terdaftar, silakan login');
    err.code = 'AUTH_EMAIL_TAKEN';
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, createdBy: email },
    select: { id: true, email: true, createdAt: true, createdBy: true },
  });

  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: getRefreshExpiry(), createdBy: email },
  });

  return { user, accessToken, refreshToken };
}

async function login(email, password) {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) {
    const err = new Error('Email tidak terdaftar');
    err.code = 'AUTH_EMAIL_NOT_FOUND';
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Password salah');
    err.code = 'AUTH_WRONG_PASSWORD';
    throw err;
  }

  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: getRefreshExpiry(), createdBy: email },
  });

  const { password: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

async function refresh(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.code = 'AUTH_TOKEN_EXPIRED';
    throw err;
  }

  const storedToken = await prisma.refreshToken.findFirst({ where: { token, deletedAt: null } });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    const err = new Error('Refresh token not found or expired');
    err.code = 'AUTH_TOKEN_EXPIRED';
    throw err;
  }

  const user = await prisma.user.findFirst({ where: { id: decoded.id, deletedAt: null } });
  if (!user) {
    const err = new Error('User not found');
    err.code = 'AUTH_UNAUTHORIZED';
    throw err;
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { deletedAt: new Date(), deletedBy: user.email, updatedBy: user.email },
  });

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  await prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: user.id, expiresAt: getRefreshExpiry(), createdBy: user.email },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(token, actorEmail) {
  await prisma.refreshToken.updateMany({
    where: { token, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: actorEmail || 'system', updatedBy: actorEmail || 'system' },
  });
}

module.exports = { register, login, refresh, logout };
