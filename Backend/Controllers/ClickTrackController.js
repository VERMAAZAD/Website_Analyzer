const ClickBatch = require('../Models/ClickEvent'); // adjust path

exports.clickTracker  = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.events) || payload.events.length === 0) {
      return res.status(400).json({ ok: false, error: 'no events' });
    }
    const doc = new ClickBatch({
      siteId: payload.siteId || (payload.events[0] && payload.events[0].siteId) || 'unknown',
      anonId: payload.anonId,
      page: payload.page,
      ts: payload.ts || Date.now(),
      events: payload.events,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    await doc.save();
    res.status(200).send('ok');
  } catch (err) {
    console.error('track error', err);
    res.status(500).send('err');
  }
};



// example aggregation route
exports.trackSummery = async (req, res) => {
  const siteId = req.query.siteId;
  const days = parseInt(req.query.days || '7', 10);
  const since = Date.now() - days * 24 * 3600 * 1000;

  const agg = await ClickBatch.aggregate([
    { $match: { siteId, ts: { $gte: since } } },
    { $unwind: '$events' },
    { $group: { _id: { page: '$page', selector: '$events.selector' }, count: { $sum: 1 }, xAvg: { $avg: '$events.x' }, yAvg: { $avg: '$events.y' } } },
    { $sort: { count: -1 } },
    { $limit: 200 }
  ]);
  res.json({ ok: true, data: agg });
};

