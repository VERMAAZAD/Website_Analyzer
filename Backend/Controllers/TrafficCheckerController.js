const requestIp = require("request-ip");
const geoip = require("geoip-lite");

const Trafficchecker = require("../Models/Trafficchecker");

exports.checkTraffic = async (req, res) => {
  try {
    const clientIp = requestIp.getClientIp(req);
    const location = geoip.lookup(clientIp) || {};

    // Get Referer header (e.g. "https://www.google.com/search?q=site")
    const referer = req.headers.referer || req.headers.referrer || "";

    // Detect search engine
    let searchEngine = "Direct";
    if (referer.includes("google.")) searchEngine = "Google";
    else if (referer.includes("bing.")) searchEngine = "Bing";
    else if (referer.includes("yahoo.")) searchEngine = "Yahoo";
    else if (referer.includes("duckduckgo.")) searchEngine = "DuckDuckGo";
    else if (referer.includes("baidu.")) searchEngine = "Baidu";
    else if (referer.includes("yandex.")) searchEngine = "Yandex";

    const traffic = new Trafficchecker({
      siteId: req.body.siteId,
      visitorId: req.body.visitorId, // from cookie or uuid
      domain: req.body.domain,
      path: req.body.path,
      ip: clientIp,
      userAgent: req.headers["user-agent"],
      location,
      searchEngine,
    });

    await traffic.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Failed to track visitor" });
  }
};



function formatUTCDateString(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

exports.GetallUniqueDomains = async (req, res) => {
  try {
    // compute UTC midnight today & yesterday
    const now = new Date();
    const todayUTCmidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterdayUTCmidnight = new Date(todayUTCmidnight);
    yesterdayUTCmidnight.setUTCDate(yesterdayUTCmidnight.getUTCDate() - 1);

    const todayStr = formatUTCDateString(todayUTCmidnight);
    const yesterdayStr = formatUTCDateString(yesterdayUTCmidnight);

    // ---- 1. Get all-time totals ----
    const allTime = await Trafficchecker.aggregate([
      { $match: { domain: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$domain",
          totalViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" }
        }
      },
      {
        $project: {
          domain: "$_id",
          totalViews: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" },
          _id: 0
        }
      }
    ]);

    // ---- 2. Get stats from yesterday midnight UTC onward (yesterday + today) ----
    const dailyStats = await Trafficchecker.aggregate([
      {
        $match: {
          domain: { $exists: true, $ne: "" },
          timestamp: { $gte: yesterdayUTCmidnight } // >= yesterday 00:00 UTC
        }
      },
      {
        $group: {
          _id: {
            domain: "$domain",
            // force UTC formatting so the day strings match JS UTC strings
            day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "+00:00" } }
          },
          totalViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" }
        }
      },
      {
        $project: {
          domain: "$_id.domain",
          day: "$_id.day",
          totalViews: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" },
          _id: 0
        }
      }
    ]);

    // Organize daily stats into explicit today / yesterday buckets (UTC strings)
    const dailyMap = {};
    dailyStats.forEach(s => {
      if (!dailyMap[s.domain]) {
        dailyMap[s.domain] = { today: { total: 0, unique: 0 }, yesterday: { total: 0, unique: 0 } };
      }
      if (s.day === todayStr) {
        dailyMap[s.domain].today = { total: s.totalViews, unique: s.uniqueVisitors };
      } else if (s.day === yesterdayStr) {
        dailyMap[s.domain].yesterday = { total: s.totalViews, unique: s.uniqueVisitors };
      } else {
        // ignore any older/other days (we only care today/yesterday here)
      }
    });

    // Merge all-time + daily into final result
    const result = allTime.map(a => {
      const daily = dailyMap[a.domain] || { today: { total: 0, unique: 0 }, yesterday: { total: 0, unique: 0 } };

      const totalChange = daily.yesterday.total > 0
        ? (((daily.today.total - daily.yesterday.total) / daily.yesterday.total) * 100).toFixed(2)
        : "N/A";

      const uniqueChange = daily.yesterday.unique > 0
        ? (((daily.today.unique - daily.yesterday.unique) / daily.yesterday.unique) * 100).toFixed(2)
        : "N/A";

      return {
        domain: a.domain,
        allTimeTotal: a.totalViews,
        allTimeUnique: a.uniqueVisitors,
        todayTotal: daily.today.total,
        todayUnique: daily.today.unique,
        yesterdayTotal: daily.yesterday.total,
        yesterdayUnique: daily.yesterday.unique,
        totalChangePercent: totalChange,
        uniqueChangePercent: uniqueChange
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching domain stats:", err);
    res.status(500).json({ error: "Failed to fetch domain stats" });
  }
};


// visitor breakdown by country for that domain.
exports.domainTraffic = async (req, res) => {
  try {
    const { domain } = req.params;
    const { filter } = req.query; // "today" or "all"

    const matchQuery = { domain };

    if (filter === "today") {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0, 0, 0, 0
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59, 59, 999
      );

      matchQuery.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    const locationStats = await Trafficchecker.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$location.country",
          visitors: { $addToSet: "$visitorId" },
          totalViews: { $sum: 1 },
        },
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          uniqueVisitors: { $size: "$visitors" },
          _id: 0,
        },
      },
      { $sort: { totalViews: -1 } },
    ]);

    res.json(locationStats);
  } catch (err) {
    console.error("Error fetching domain traffic:", err);
    res.status(500).json({ error: "Failed to fetch location stats" });
  }
};





exports.GetLast7DaysTraffic = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6); // last 7 days

    const dailyStats = await Trafficchecker.aggregate([
      {
        $match: {
          domain: { $exists: true, $ne: "" },
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            domain: "$domain",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "+00:00" } }
          },
          totalViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorId" }
        }
      },
      {
        $project: {
          domain: "$_id.domain",
          day: "$_id.day",
          totalViews: 1,
          uniqueVisitors: { $size: "$uniqueVisitors" },
          _id: 0
        }
      }
    ]);

    // organize by domain → day
    const domainMap = {};
    dailyStats.forEach(s => {
      if (!domainMap[s.domain]) domainMap[s.domain] = {};
      domainMap[s.domain][s.day] = {
        total: s.totalViews,
        unique: s.uniqueVisitors
      };
    });

    // final response
    const result = Object.keys(domainMap).map(domain => ({
      domain,
      daily: domainMap[domain] // { "2025-09-28": {total,unique}, ... }
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching last 7 days:", err);
    res.status(500).json({ error: "Failed to fetch last 7 days traffic" });
  }
};
