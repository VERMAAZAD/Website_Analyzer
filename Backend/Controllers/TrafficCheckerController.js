const requestIp = require("request-ip");
const geoip = require("geoip-lite");

const Trafficchecker = require("../Models/Trafficchecker");

exports.checkTraffic = async (req, res) => {
  try {
    const clientIp = requestIp.getClientIp(req);
    const location = geoip.lookup(clientIp) || {};

    const traffic = new Trafficchecker({
      siteId: req.body.siteId,
      visitorId: req.body.visitorId,
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
    const filter = req.query.filter || "all";

    // Base match
    const match = { domain };

    // If filter is "today", use UTC midnight
    if (filter === "today") {
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      match.timestamp = { $gte: todayUTC };
    }

    // Aggregate unique visitors per country
    const locationStats = await Trafficchecker.aggregate([
      { $match: match },
      {
        $group: {
          _id: { country: "$location.country", visitor: "$visitorId" },
          totalViews: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.country",
          totalViews: { $sum: "$totalViews" },
          uniqueVisitors: { $sum: 1 }
        }
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          uniqueVisitors: 1,
          _id: 0
        }
      }
    ], { allowDiskUse: true });

    res.json(locationStats);
  } catch (err) {
    console.error("Error fetching domain traffic:", err);
    res.status(500).json({ error: "Failed to fetch location stats" });
  }
};




exports.GetLast7DaysTraffic = async (req, res) => {
  try {
    // Generate last 7 days (YYYY-MM-DD)
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      last7Days.push(d.toISOString().slice(0, 10));
    }

    // Aggregate traffic from last 7 days
     const dailyStats = await Trafficchecker.aggregate([
  {
    $match: {
      domain: { $exists: true, $ne: "" },
      timestamp: { $gte: new Date(last7Days[0] + "T00:00:00Z") }
    }
  },
  // Step 1: Get unique visitors per domain/day
  {
    $group: {
      _id: {
        domain: "$domain",
        day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "+00:00" } },
        visitor: "$visitorId"
      },
      totalViews: { $sum: 1 } // count each visit of that visitor
    }
  },
  // Step 2: Aggregate again per domain/day
  {
    $group: {
      _id: { domain: "$_id.domain", day: "$_id.day" },
      totalViews: { $sum: "$totalViews" },
      uniqueVisitors: { $sum: 1 } // each _id.visitor is unique now
    }
  },
  {
    $project: {
      domain: "$_id.domain",
      day: "$_id.day",
      totalViews: 1,
      uniqueVisitors: 1,
      _id: 0
    }
  }
], { allowDiskUse: true });
    const domainMap = {};
    dailyStats.forEach(s => {
      if (!domainMap[s.domain]) domainMap[s.domain] = {};
      domainMap[s.domain][s.day] = {
        total: s.totalViews,
        unique: s.uniqueVisitors
      };
    });

    // Ensure all last 7 days exist for each domain
    const result = Object.keys(domainMap).map(domain => {
      const daily = {};
      last7Days.forEach(day => {
        daily[day] = domainMap[domain][day] || { total: 0, unique: 0 };
      });
      return { domain, daily };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching last 7 days:", err);
    res.status(500).json({ error: "Failed to fetch last 7 days traffic" });
  }
};

