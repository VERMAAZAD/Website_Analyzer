const LinksDetectorLink = require('../Models/LinksDetectorLink');
const LinksDetectorClickEvent = require('../Models/LinksDetectorClickEvent');
const crypto = require('crypto');
const geoip = require('geoip-lite');

const ANON_COOKIE_NAME = process.env.ANON_COOKIE_NAME || 'anonId';
const ANON_COOKIE_MAX_AGE = parseInt(
  process.env.ANON_COOKIE_MAX_AGE || '31536000000',
  10
);
function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function detectBot(ua) {
  if (!ua) return false;
  return /bot|crawler|spider|bingpreview|facebookexternalhit|curl|wget|python-requests|httpclient/i.test(
    ua
  );
}

exports.handleRedirect = async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await LinksDetectorLink.findOne({ linkId });
    if (!link) return res.status(404).send('Not found');

    const ip =
      (req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        '')
        .split(',')[0]
        .trim();
    const ua = req.get('User-Agent') || '';
    const referer = req.get('Referer') || req.query.ref || null;
    let anonId = req.cookies?.[ANON_COOKIE_NAME] || req.query.anon || null;

    if (!anonId) {
      anonId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      res.cookie(ANON_COOKIE_NAME, anonId, {
        maxAge: ANON_COOKIE_MAX_AGE,
        httpOnly: false,
      });
    }

    const isBot = detectBot(ua);
    const geo = geoip.lookup(ip) || {};
    const country = geo.country || 'XX';
    const ipHash = hashIp(ip);
    const decision = 'redirect';

    LinksDetectorClickEvent.create({
      linkId,
      ipHash,
      ua,
      referer,
      anonId,
      country,
      decision,
      targetUrl: link.preflight?.finalUrl || link.target,
      isBot,
    }).catch((e) => console.error('click save err', e));

    const redirectTo = link.preflight?.finalUrl || link.target;
    return res.redirect(302, redirectTo);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};
