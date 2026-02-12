// Controllers/TrafficCheckerController.js
const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const mongoose = require("mongoose");
const Trafficchecker = require("../Models/Trafficchecker");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const IST_TIMEZONE = "+05:30";

function toObjectIdIfValid(id) {
  try {
    if (mongoose.isValidObjectId(id)) return new mongoose.Types.ObjectId(id);
  } catch (e) {}
  return id;
}

/**
 * Return a YYYY-MM-DD string representing the IST date of the given JS Date
 */
function getISTDateStr(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Given a JS Date "now", return a Date (UTC) that represents the UTC instant
 * at which the IST day starts (i.e. IST YYYY-MM-DDT00:00:00+05:30 converted to UTC).
 *
 * Calculation:
 *   IST midnight for YYYY-MM-DD corresponds to UTC = Date.UTC(YYYY,MM,DD) - IST_OFFSET_MS
 */
function startOfISTDayUTC(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();
  // UTC time corresponding to IST midnight:
  return new Date(Date.UTC(y, m, d) - IST_OFFSET_MS);
}

/**
 * checkTraffic - Save a traffic record using timestamp (UTC)
 */
exports.checkTraffic = async (req, res) => {
  try {
    const { userId, siteId, visitorId, domain, path } = req.body;

    if (!userId || !siteId) {
      return res.status(400).json({ error: "Missing userId or siteId" });
    }

    const lowerDomain = (domain || "").toLowerCase();

    // basic proxy / anonymizer detection (domain-based)
    if (
      lowerDomain.includes("proxysite") ||
      lowerDomain.includes("hide.me") ||
      lowerDomain.includes("kproxy") ||
      lowerDomain.includes("vpn") ||
      lowerDomain.includes("anonymouse") ||
      lowerDomain.includes("proxy") ||
      (siteId && lowerDomain !== String(siteId).toLowerCase())
    ) {
      return res.status(403).json({ blocked: true, reason: "Proxy access detected" });
    }

    const clientIp = requestIp.getClientIp(req) || req.ip || "";
    const location = geoip.lookup(clientIp) || {};

    // simple IP prefix blocking; customize list if needed
    const proxyIpPatterns = ["182.", "223.", "185.", "45.", "108."];
    if (clientIp && proxyIpPatterns.some((p) => clientIp.startsWith(p))) {
      console.log(`Blocked proxy IP: ${clientIp}`);
      return res.status(403).json({ blocked: true, reason: "Proxy IP detected" });
    }

    // Save timestamp explicitly (UTC)
    const now = new Date();

    const traffic = new Trafficchecker({
      userId,
      siteId,
      visitorId,
      domain,
      path,
      ip: clientIp,
      userAgent: req.headers["user-agent"],
      location,
      timestamp: now,
    });

    await traffic.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Failed to track visitor" });
  }
};

/**
 * GetallUniqueDomains - all-time + today/yesterday comparisons
 * Uses timestamp (UTC) stored in docs and converts/groups by IST in aggregation
 */
exports.GetallUniqueDomains = async (req, res) => {
  try {
    if (!req.userId && !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.userId || req.user?._id;
    const userRole = req.user?.role || "user";

    const matchCondition = { domain: { $exists: true, $ne: "" } };

    if (userRole === "user") {
      matchCondition.userId = toObjectIdIfValid(userId);
    }

    const now = new Date();
    const todayISTStr = getISTDateStr(now);
    const yesterdayISTStr = getISTDateStr(
      new Date(now.getTime() - MS_IN_DAY)
    );

    const todayStartUTC = startOfISTDayUTC(now);
    const yesterdayStartUTC = new Date(
      todayStartUTC.getTime() - MS_IN_DAY
    );

    /* --------------------------------------------------
       1️⃣ ALL TIME TOTAL VIEWS
    -------------------------------------------------- */

    const totalViewsAgg = await Trafficchecker.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$domain",
          totalViews: { $sum: 1 }
        }
      }
    ], { allowDiskUse: true });

    /* --------------------------------------------------
       2️⃣ ALL TIME UNIQUE VISITORS
    -------------------------------------------------- */

    const uniqueAgg = await Trafficchecker.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { domain: "$domain", visitor: "$visitorId" }
        }
      },
      {
        $group: {
          _id: "$_id.domain",
          uniqueVisitors: { $sum: 1 }
        }
      }
    ], { allowDiskUse: true });

    /* --------------------------------------------------
       3️⃣ DAILY TOTALS (Today + Yesterday)
    -------------------------------------------------- */

    const dailyTotalAgg = await Trafficchecker.aggregate([
      {
        $match: {
          ...matchCondition,
          timestamp: { $gte: yesterdayStartUTC }
        }
      },
      {
        $group: {
          _id: {
            domain: "$domain",
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
                timezone: IST_TIMEZONE
              }
            }
          },
          totalViews: { $sum: 1 }
        }
      }
    ], { allowDiskUse: true });

    /* --------------------------------------------------
       4️⃣ DAILY UNIQUE (Safe grouping method)
    -------------------------------------------------- */

    const dailyUniqueAgg = await Trafficchecker.aggregate([
      {
        $match: {
          ...matchCondition,
          timestamp: { $gte: yesterdayStartUTC }
        }
      },
      {
        $group: {
          _id: {
            domain: "$domain",
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
                timezone: IST_TIMEZONE
              }
            },
            visitor: "$visitorId"
          }
        }
      },
      {
        $group: {
          _id: {
            domain: "$_id.domain",
            day: "$_id.day"
          },
          uniqueVisitors: { $sum: 1 }
        }
      }
    ], { allowDiskUse: true });

    /* --------------------------------------------------
       5️⃣ MERGE ALL RESULTS
    -------------------------------------------------- */

    const totalMap = {};
    totalViewsAgg.forEach(t => {
      totalMap[t._id] = { total: t.totalViews };
    });

    uniqueAgg.forEach(u => {
      if (!totalMap[u._id]) totalMap[u._id] = {};
      totalMap[u._id].unique = u.uniqueVisitors;
    });

    const dailyMap = {};

    dailyTotalAgg.forEach(d => {
      const { domain, day } = d._id;
      if (!dailyMap[domain]) dailyMap[domain] = {};
      if (!dailyMap[domain][day]) dailyMap[domain][day] = {};
      dailyMap[domain][day].total = d.totalViews;
    });

    dailyUniqueAgg.forEach(d => {
      const { domain, day } = d._id;
      if (!dailyMap[domain]) dailyMap[domain] = {};
      if (!dailyMap[domain][day]) dailyMap[domain][day] = {};
      dailyMap[domain][day].unique = d.uniqueVisitors;
    });

    /* --------------------------------------------------
       6️⃣ FINAL RESPONSE BUILD
    -------------------------------------------------- */

    const result = Object.keys(totalMap).map(domain => {

      const today = dailyMap[domain]?.[todayISTStr] || {};
      const yesterday = dailyMap[domain]?.[yesterdayISTStr] || {};

      const todayTotal = today.total || 0;
      const todayUnique = today.unique || 0;
      const yesterdayTotal = yesterday.total || 0;
      const yesterdayUnique = yesterday.unique || 0;

      const totalChange =
        yesterdayTotal > 0
          ? (((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(2)
          : "N/A";

      const uniqueChange =
        yesterdayUnique > 0
          ? (((todayUnique - yesterdayUnique) / yesterdayUnique) * 100).toFixed(2)
          : "N/A";

      return {
        domain,
        allTimeTotal: totalMap[domain].total || 0,
        allTimeUnique: totalMap[domain].unique || 0,
        todayTotal,
        todayUnique,
        yesterdayTotal,
        yesterdayUnique,
        totalChangePercent: totalChange,
        uniqueChangePercent: uniqueChange
      };
    });

    res.json(result);

  } catch (err) {
    console.error("❌ Error fetching domain stats:", err);
    res.status(500).json({ error: "Failed to fetch domain stats" });
  }
};



/**
 * domainTraffic - visitor breakdown by country for a domain (supports ?filter=today)
 */
exports.domainTraffic = async (req, res) => {
  try {
    const { domain } = req.params;
    const { filter } = req.query;

    if (!req.user) {
      console.error("❌ User not authenticated or req.user missing");
      return res.status(401).json({ error: "Unauthorized: User not found in request" });
    }

    const userId = req.userId || req.user._id;
    const userRole = req.user.role || "user";

    const matchCondition = { domain: { $exists: true, $ne: "" } };
    if (domain) matchCondition.domain = domain;
    if (userRole === "user") {
      matchCondition.userId = toObjectIdIfValid(userId);
    }

    // If filter === "today", restrict to IST today's UTC start
    if (filter === "today") {
      matchCondition.timestamp = { $gte: startOfISTDayUTC(new Date()) };
    }

    const locationStats = await Trafficchecker.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { country: "$location.country", visitor: "$visitorId" },
          totalViews: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.country",
          totalViews: { $sum: "$totalViews" },
          uniqueVisitors: { $sum: 1 },
        },
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          uniqueVisitors: 1,
          _id: 0,
        },
      },
      { $sort: { totalViews: -1 } },
    ], { allowDiskUse: true });

    res.json(locationStats);
  } catch (err) {
    console.error("Error fetching domain traffic:", err);
    res.status(500).json({ error: "Failed to fetch location stats" });
  }
};

/**
 * GetLast7DaysTraffic - last 7 IST days per domain (returns array of { domain, daily: { 'YYYY-MM-DD': { total, unique } } })
 */
exports.GetLast7DaysTraffic = async (req, res) => {
  try {
    if (!req.user) {
      console.error("❌ User not authenticated or req.user missing");
      return res.status(401).json({ error: "Unauthorized: User not found in request" });
    }

    const userId = req.userId || req.user._id;
    const userRole = req.user.role || "user";

    const baseMatch = { domain: { $exists: true, $ne: "" } };
    if (userRole === "user") {
      baseMatch.userId = toObjectIdIfValid(userId);
    }

    // Generate last 7 IST date strings (from 6 days ago -> today)
    const now = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * MS_IN_DAY);
      last7Days.push(getISTDateStr(d));
    }

    // Compute UTC start of the earliest IST day to limit scanned docs
    const earliestUTC = startOfISTDayUTC(new Date(now.getTime() - 6 * MS_IN_DAY));

    // Aggregate: unique visitors per domain/day using IST timezone
    const dailyStats = await Trafficchecker.aggregate([
      {
        $match: {
          ...baseMatch,
          timestamp: { $gte: earliestUTC },
        },
      },
      {
        $group: {
          _id: {
            domain: "$domain",
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
                timezone: IST_TIMEZONE,
              },
            },
            visitor: "$visitorId",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { domain: "$_id.domain", day: "$_id.day" },
          totalViews: { $sum: "$count" },
          uniqueVisitors: { $sum: 1 },
        },
      },
      {
        $project: {
          domain: "$_id.domain",
          day: "$_id.day",
          totalViews: 1,
          uniqueVisitors: 1,
          _id: 0,
        },
      },
    ], { allowDiskUse: true });

    // compose domain -> day map
    const domainMap = {};
    dailyStats.forEach((s) => {
      if (!domainMap[s.domain]) domainMap[s.domain] = {};
      domainMap[s.domain][s.day] = { total: s.totalViews, unique: s.uniqueVisitors };
    });

    // final result ensures each domain has an entry for all last7Days
    const result = Object.keys(domainMap).map((domain) => {
      const daily = {};
      last7Days.forEach((day) => {
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

/**
 * GetTopCountries - overall top countries (limit 5)
 */
exports.GetTopCountries = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchCondition = { domain: { $exists: true, $ne: "" } };
    if (user.role === "user") {
      matchCondition.userId = toObjectIdIfValid(user._id);
    }

    const topCountries = await Trafficchecker.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { country: "$location.country", visitor: "$visitorId" },
          totalViews: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.country",
          totalViews: { $sum: "$totalViews" },
          uniqueVisitors: { $sum: 1 },
        },
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          uniqueVisitors: 1,
          _id: 0,
        },
      },
      { $sort: { totalViews: -1 } },
      { $limit: 5 },
    ], { allowDiskUse: true });

    res.json(topCountries);
  } catch (err) {
    console.error("Error fetching top countries:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GetLast7DaysByDomain - get last 7 IST days for a specific domain
 * returns { domain, daily: { 'YYYY-MM-DD': { total, unique } } }
 */
exports.GetLast7DaysByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.userId || req.user._id;
    const userRole = req.user.role || "user";
    const matchCondition = { domain };
    if (userRole === "user") matchCondition.userId = toObjectIdIfValid(userId);

    // last7 IST days strings
    const now = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * MS_IN_DAY);
      last7Days.push(getISTDateStr(d));
    }

    // earliest UTC to limit scan
    const earliestUTC = startOfISTDayUTC(new Date(now.getTime() - 6 * MS_IN_DAY));

    const stats = await Trafficchecker.aggregate([
      {
        $match: {
          ...matchCondition,
          timestamp: { $gte: earliestUTC },
        },
      },
      {
        $group: {
          _id: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: IST_TIMEZONE },
            },
            visitor: "$visitorId",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          total: { $sum: "$count" },
          unique: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ], { allowDiskUse: true });

    const daily = {};
    last7Days.forEach((day) => {
      const record = stats.find((s) => s._id === day);
      daily[day] = { total: record ? record.total : 0, unique: record ? record.unique : 0 };
    });

    res.json({ domain, daily });
  } catch (err) {
    console.error("❌ Error fetching last 7 days by domain:", err);
    res.status(500).json({ error: "Failed to fetch domain analytics" });
  }
};

/**
 * GetCountriesByDomain - country stats for a specific domain
 */
exports.GetCountriesByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.userId || req.user._id;
    const userRole = req.user.role || "user";

    const matchCondition = { domain };
    if (userRole === "user") matchCondition.userId = toObjectIdIfValid(userId);

    const countryStats = await Trafficchecker.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { country: "$location.country", visitor: "$visitorId" },
          totalViews: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.country",
          totalViews: { $sum: "$totalViews" },
          uniqueVisitors: { $sum: 1 },
        },
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          uniqueVisitors: 1,
          _id: 0,
        },
      },
      { $sort: { totalViews: -1 } },
    ], { allowDiskUse: true });

    res.json(countryStats);
  } catch (err) {
    console.error("❌ Error fetching country stats by domain:", err);
    res.status(500).json({ error: "Failed to fetch country stats" });
  }
};
