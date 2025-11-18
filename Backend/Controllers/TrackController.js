// controllers/trackController.js
const UserVisit = require('../Models/UserVisit');
const UserFlow = require('../Models/UserFlow');
const getClientInfo = require('../Utils/getClientInfo');

exports.logVisit = async (req, res) => {
  try {
    const { uid, url, domain, path, referrer, params } = req.body || {};
    const info = getClientInfo(req);

    const visit = await UserVisit.create({
      uid: uid || null,
      url: url || (req.body && req.body.url) || '',
      domain: domain || req.hostname || (new URL(req.body?.url || 'http://').hostname),
      path: path || (req.body && req.body.path) || '',
      referrer: referrer || (req.headers.referer || ''),
      params: params || {},
      timestamp: new Date(),
      ip: info.ip,
      country: info.country,
      browser: info.browser,
      os: info.os,
      device: info.device
    });

    // If we have uid, append step to user flow (simple push)
    if (uid) {
      await UserFlow.findOneAndUpdate(
        { uid },
        { $push: { steps: { domain: visit.domain, path: visit.path, url: visit.url, timestamp: visit.timestamp } } },
        { upsert: true, new: true }
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('logVisit err', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.outboundClick = async (req, res) => {
  try {
    const { uid, fromDomain, toUrl, referrer } = req.body || {};
    const info = getClientInfo(req);

    await UserVisit.create({
      uid: uid || null,
      url: toUrl,
      domain: fromDomain,
      path: 'OUTBOUND',
      referrer: referrer || '',
      timestamp: new Date(),
      ip: info.ip,
      country: info.country,
      browser: info.browser,
      os: info.os,
      device: info.device,
      params: { outbound: true }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('outboundClick err', err);
    return res.status(500).json({ error: err.message });
  }
};
