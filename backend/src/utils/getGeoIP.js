const http = require('http');
const https = require('https');
const logger = require('./logger');

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^::1$/,
];

function isPrivateIp(ip) {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(ip));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('GeoIP request timed out'));
    });
  });
}

async function getGeoIP(ip) {
  if (!ip || isPrivateIp(ip)) {
    return { country: 'Local', city: null };
  }

  try {
    const baseUrl = process.env.GEOIP_API_URL;
    if (!baseUrl) throw new Error('Missing required env: GEOIP_API_URL');
    const data = await httpGet(`${baseUrl}/${ip}?fields=country,city,regionName`);
    if (data.status === 'success' || data.country) {
      return { country: data.country || null, city: data.city || null };
    }
    return { country: null, city: null };
  } catch (err) {
    logger.warn(`GeoIP lookup failed for ${ip}: ${err.message}`);
    return { country: null, city: null };
  }
}

module.exports = { getGeoIP };
