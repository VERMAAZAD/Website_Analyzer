const requestIp = require("request-ip");
const geoip = require("geoip-lite");

const trafficchecker = require("../Models/trafficcheckerModel");

exports.checkTraffic = async (req, res) => {
  try {
    const clientIp = requestIp.getClientIp(req);
    const location = geoip.lookup(clientIp) || {};

    const traffic = new trafficchecker({
      siteId: req.body.siteId,
      visitorId: req.body.visitorId, // from cookie or uuid
      domain: req.body.domain,
      path: req.body.path,
      ip: clientIp,
      userAgent: req.headers["user-agent"],
      location,
    });

    await traffic.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Failed to track visitor" });
  }
};



exports.GetSiteState = async (req, res) => {
  try {
    const { siteId } = req.params;

    const totalViews = await trafficchecker.countDocuments({ siteId });
    const uniqueVisitors = await trafficchecker.distinct("visitorId", { siteId });

    res.json({
      siteId,
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
};