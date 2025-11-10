// controllers/linkController.js
const LinksDetectorLink = require("../Models/LinksDetectorLink");
const LinksDetectorClickEvent = require("../Models/LinksDetectorClickEvent");
const LinksDomain = require("../Models/LinksDomain");
const { preflightFollow } = require("../Utils/preflight");
const crypto = require("crypto");
const geoip = require("geoip-lite");

const shortId = () =>
  crypto.randomBytes(3).toString("base64").replace(/\W/g, "").slice(0, 6);

const PREFLIGHT_ENABLED = (process.env.PREFLIGHT_ENABLED || "true") === "true";
const DEFAULT_BASE_URL =
  process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
const ANON_COOKIE_NAME = process.env.ANON_COOKIE_NAME || "anonId";
const ANON_COOKIE_MAX_AGE = parseInt(
  process.env.ANON_COOKIE_MAX_AGE || "31536000000",
  10
);

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function detectBot(ua) {
  if (!ua) return false;
  return /bot|crawler|spider|bingpreview|facebookexternalhit|curl|wget|python-requests|httpclient/i.test(
    ua
  );
}

/* ============================================================
 * 🧩 CREATE LINK (with custom domain support)
 * ============================================================ */
exports.createLink = async (req, res) => {
  try {
    const { target, owner, options, chain, domain } = req.body;

    if (!target && (!chain || chain.length === 0)) {
      return res
        .status(400)
        .json({ ok: false, error: "target or chain required" });
    }

    // 🔹 Use selected domain if provided, otherwise fallback
    const baseDomain = domain?.replace(/\/$/, "") || DEFAULT_BASE_URL;

    const linkId = shortId();
    const isChain = Array.isArray(chain) && chain.length > 0;

    const link = new LinksDetectorLink({
      linkId,
      owner: owner || null,
      baseDomain, // 👈 store the selected domain
      target: isChain ? chain[0].url : target,
      isChain,
      chain: isChain
        ? chain.map((c, i) => ({
            order: c.order || i + 1,
            url: c.url,
            domain: new URL(c.url).hostname,
          }))
        : [],
      options: options || {},
    });

    // Run preflight if needed
    if (PREFLIGHT_ENABLED && !isChain && target) {
      try {
        const pf = await preflightFollow(target);
        link.preflight = pf;
      } catch (e) {
        console.warn("Preflight failed:", e.message);
      }
    }

    await link.save();

    // ✅ Build tracking URLs (per selected domain)
    let trackingUrls = [];
    if (isChain && link.chain.length > 0) {
      trackingUrls = link.chain.map((step) => ({
        step: step.order,
        url: `${baseDomain}/r/${linkId}/${step.order}`,
        target: step.url,
      }));
    } else {
      trackingUrls = [
        {
          step: 1,
          url: `${baseDomain}/r/${linkId}`,
          target: link.target,
        },
      ];
    }

    return res.json({
      ok: true,
      linkId,
      trackingUrl: `${baseDomain}/r/${linkId}`,
      trackingUrls,
      target: link.target,
      isChain: link.isChain,
      chain: link.chain,
      preflight: link.preflight || null,
    });
  } catch (err) {
    console.error("Create Link Error:", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
};

/* ============================================================
 * 📊 GET LINK STATS
 * ============================================================ */
exports.getLinkStats = async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await LinksDetectorLink.findOne({ linkId }).lean();
    if (!link) return res.status(404).json({ ok: false, error: "not found" });

    const totalClicks = await LinksDetectorClickEvent.countDocuments({ linkId });
    const uniqueVisitorsAgg = await LinksDetectorClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: "$anonId" } },
      { $count: "uniqueCount" },
    ]);
    const uniqueVisitors = uniqueVisitorsAgg[0]?.uniqueCount || 0;

    const clicksLast24h = await LinksDetectorClickEvent.countDocuments({
      linkId,
      ts: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
    });

    const botClicks = await LinksDetectorClickEvent.countDocuments({
      linkId,
      isBot: true,
    });

    const topCountries = await LinksDetectorClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: "$country", clicks: { $sum: 1 } } },
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
      baseDomain: link.baseDomain,
      target: link.target,
      chain: link.chain,
      isChain: link.isChain,
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
    return res.status(500).json({ ok: false, error: "server error" });
  }
};


exports.getAllLinks = async (req, res) => {
  try {
    const links = await LinksDetectorLink.find().lean();

    const linkIds = links.map(l => l.linkId);
    const clickCounts = await LinksDetectorClickEvent.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: "$linkId", count: { $sum: 1 } } },
    ]);

    const clickMap = clickCounts.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    const data = links.map(l => ({
      _id: l._id,
      linkId: l.linkId,
      target: l.target,
      chain: l.chain || [],
      generatedUrl: `https://${l.baseDomain || "your-default.com"}/r/${l.linkId}`,
      clicks: clickMap[l.linkId] || 0,
      createdAt: l.createdAt,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/* ============================================================
 * 🚀 HANDLE REDIRECT
 * ============================================================ */

exports.handleRedirect = async (req, res) => {
  try {
    const { linkId } = req.params;
    const currentStep = parseInt(req.query.step) || 1;
    const anonId = req.cookies.anonId || nanoid(10);
    const journeyId = req.cookies.journeyId || nanoid(12);

    // Store anon + journey id in cookies for next hops
    res.cookie("anonId", anonId, { maxAge: 7 * 24 * 3600 * 1000 });
    res.cookie("journeyId", journeyId, { maxAge: 7 * 24 * 3600 * 1000 });

    // Find link
    const link = await Link.findOne({ linkId });
    if (!link) return res.status(404).send("Link not found");

    const isChain = link.isChain && link.chain?.length > 0;

    // Which step are we at?
    let nextUrl;
    let stepInfo;

    if (isChain) {
      stepInfo = link.chain.find(c => c.order === currentStep);
      if (!stepInfo) return res.status(400).send("Invalid chain step");

      // Track this step
      await ClickEvent.create({
        linkId,
        chainId: linkId,
        stepOrder: currentStep,
        stepUrl: stepInfo.url,
        direction: "forward",
        anonId,
        journeyId,
        targetUrl: stepInfo.url,
        isBot: false,
      });

      // Determine next hop
      const nextStep = link.chain.find(c => c.order === currentStep + 1);
      nextUrl = nextStep
        ? `${req.protocol}://${req.get("host")}/r/${linkId}?step=${currentStep + 1}`
        : link.target;
    } else {
      // Non-chain direct link
      await ClickEvent.create({
        linkId,
        stepOrder: 1,
        stepUrl: link.target,
        anonId,
        journeyId,
        targetUrl: link.target,
        direction: "forward",
      });
      nextUrl = link.target;
    }

    return res.redirect(nextUrl);
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).send("Server error");
  }
};


exports.addBaseUrl = async (req, res) => {
  try {
    const { baseUrl, owner } = req.body;
    if (!baseUrl) return res.status(400).json({ ok: false, error: 'baseUrl required' });

    const name = new URL(baseUrl).hostname;
    const domain = new LinksDomain({ name, baseUrl, owner });
    await domain.save();
    res.json({ ok: true, domain });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
};

// 🟡 Get all domains
exports.getBaseDomain = async (req, res) => {
  try {
    const domains = await LinksDomain.find().sort({ createdAt: -1 });
    res.json({ ok: true, domains });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'server error' });
  }
};

// 🔴 Delete domain
exports.deleteBaseDomain = async (req, res) => {
  try {
    await LinksDomain.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'server error' });
  }
};