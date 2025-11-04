// controllers/linkController.js
const LinksDetectorLink = require('../Models/LinksDetectorLink');
const LinksDetectorClickEvent = require('../Models/LinksDetectorClickEvent');

const { preflightFollow } = require('../Utils/preflight');
const crypto = require('crypto');

const shortId = () =>
  crypto.randomBytes(3).toString('base64').replace(/\W/g, '').slice(0, 6);

const PREFLIGHT_ENABLED =
  (process.env.PREFLIGHT_ENABLED || 'true') === 'true';

exports.createLink = async (req, res) => {
  try {
    const { target, owner, options } = req.body;
    if (!target)
      return res.status(400).json({ ok: false, error: 'target required' });

    const linkId = shortId();
    const link = new LinksDetectorLink({
      linkId,
      owner: owner || null,
      target,
      options: options || {},
    });

    if (PREFLIGHT_ENABLED) {
      try {
        const pf = await preflightFollow(target);
        link.preflight = pf;
      } catch (e) {
        console.warn('Preflight failed:', e.message);
      }
    }

    await link.save();

    return res.json({
      ok: true,
      linkId,
      trackingUrl: `${process.env.BASE_URL?.replace(/\/$/, '')}/r/${linkId}`,
      target,
      createdAt: link.createdAt,
      preflight: link.preflight || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
};

// Get stats for a tracking link
exports.getLinkStats = async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await LinksDetectorLink.findOne({ linkId }).lean();
    if (!link) return res.status(404).json({ ok: false, error: 'not found' });

    const totalClicks = await LinksDetectorClickEvent.countDocuments({ linkId });
    const uniqueVisitorsAgg = await LinksDetectorClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: '$anonId' } },
      { $count: 'uniqueCount' },
    ]);
    const uniqueVisitors = uniqueVisitorsAgg[0]?.uniqueCount || 0;

    const clicksLast24h = await LinksDetectorClickEvent.countDocuments({
      linkId,
      ts: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
    });

    const botClicks = await LinksDetectorClickEvent.countDocuments({ linkId, isBot: true });

    const topCountries = await LinksDetectorClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: '$country', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
    ]);

    const recentEvents = await LinksDetectorClickEvent.find({ linkId })
      .sort({ ts: -1 })
      .limit(20)
      .lean();

    return res.json({
      ok: true,
      linkId,
      target: link.target,
      createdAt: link.createdAt,
      summary: {
        totalClicks,
        uniqueVisitors,
        clicksLast24h,
        botClicks,
        hopCountPreflight: link.preflight?.hopCount || 0,
      },
      topCountries: topCountries.map((x) => ({
        country: x._id,
        clicks: x.clicks,
      })),
      recentEvents,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
};
