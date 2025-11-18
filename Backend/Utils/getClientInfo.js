// utils/getClientInfo.js
const useragent = require('useragent');
const geoip = require('geoip-lite');

function getClientInfo(req) {
  // get IP (support x-forwarded-for if behind proxy)
  let ip = '';
  if (req.headers['x-forwarded-for']) {
    ip = req.headers['x-forwarded-for'].split(',')[0].trim();
  } else if (req.socket && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  } else {
    ip = req.ip || '';
  }

  const ua = useragent.parse(req.headers['user-agent'] || '');
  const geo = geoip.lookup(ip) || {};

  return {
    ip,
    country: geo.country || 'Unknown',
    browser: ua.family || 'Unknown',
    os: (ua.os && ua.os.family) || 'Unknown',
    device: (ua.device && ua.device.family) || 'Unknown'
  };
}

module.exports = getClientInfo;
