const jwt = require('jsonwebtoken');

function authenticate(required = true) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (!required) {
        req.user = null;
        return next();
      }
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret');
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Access token expired' },
        });
      }
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Invalid token' },
      });
    }
  };
}

module.exports = { authenticate };
