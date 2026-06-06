const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i,
];

function isPrivateHost(hostname) {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, message: 'URL must use http or https protocol' };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, message: 'URL points to a private or local address' };
  }

  return { valid: true };
}

module.exports = { validateUrl };
