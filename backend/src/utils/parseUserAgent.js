function parseUserAgent(ua) {
  if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };

  let device = 'desktop';
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    device = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile';
  }

  let browser = 'unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome\/\d/i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome';
  else if (/firefox\/\d/i.test(ua)) browser = 'Firefox';
  else if (/safari\/\d/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';

  let os = 'unknown';
  if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

module.exports = { parseUserAgent };
