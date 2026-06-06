const redirectService = require('./redirect.service');

async function handleRedirect(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await redirectService.redirect(slug, req, res);

    if (result.requiresPassword) {
      return res.status(200).json({
        success: true,
        data: { requiresPassword: true, message: 'This URL is password protected' },
      });
    }

    return res.redirect(301, result.redirectTo);
  } catch (err) {
    next(err);
  }
}

async function handleVerifyPassword(req, res, next) {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password is required' },
      });
    }

    const result = await redirectService.verifyPassword(slug, password, req);
    return res.json({ success: true, data: { redirectTo: result.redirectTo } });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleRedirect, handleVerifyPassword };
