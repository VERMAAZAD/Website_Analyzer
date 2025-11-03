const ClickBatch = require('../Models/ClickEvent'); // adjust path

exports.clickTracker  = async (req, res) => {
   console.log("✅ Hit /trackweb/clicks");
  console.log("BODY:", req.body);

  try {
    const { siteId, anonId, events } = req.body;
    if (!siteId || !events) {
      return res.status(400).json({ error: "Missing siteId or events" });
    }

    const clickData = new ClickBatch({
      siteId,
      anonId,
      page: events[0]?.page || "",
      events,
      ts: Date.now(),
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"]?.split(",")[0] || req.ip,
    });

    await clickData.save();
    console.log("💾 Saved click data to MongoDB");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error saving click:", err);
    res.status(500).json({ error: "Server error" });
  }
}



// example aggregation route
// exports.trackSummery = async (req, res) => {
//   const siteId = req.query.siteId;
//   const days = parseInt(req.query.days || '7', 10);
//   const since = Date.now() - days * 24 * 3600 * 1000;

//   const agg = await ClickBatch.aggregate([
//     { $match: { siteId, ts: { $gte: since } } },
//     { $unwind: '$events' },
//     { $group: { _id: { page: '$page', selector: '$events.selector' }, count: { $sum: 1 }, xAvg: { $avg: '$events.x' }, yAvg: { $avg: '$events.y' } } },
//     { $sort: { count: -1 } },
//     { $limit: 200 }
//   ]);
//   res.json({ ok: true, data: agg });
// };

exports.trackSummary = async (req, res) => {
  try {
    const siteId = req.query.siteId;
    const since = Date.now() - 7 * 24 * 3600 * 1000;

    const agg = await ClickBatch.aggregate([
      { $match: { siteId, ts: { $gte: since } } },
      { $unwind: "$events" },
      { $group: { _id: "$events.type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      ok: true,
      data: agg.map(a => ({ type: a._id, count: a.count })),
    });
  } catch (err) {
    console.error("❌ Summary error:", err.message);
    res.status(500).json({ error: "Aggregation failed" });
  }
};
