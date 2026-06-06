const authService = require('./auth.service');

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    // Kirim email actor agar tercatat di deletedBy
    const actorEmail = req.user ? req.user.email : null;
    await authService.logout(refreshToken, actorEmail);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
