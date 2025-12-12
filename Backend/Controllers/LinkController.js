const { nanoid } = require("nanoid");
const CreateLink = require("../Models/CreateLink");
const CreateLinkAnalytics = require("../Models/CreateLinkAnalytics");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const crypto = require("crypto");

const BASE = process.env.BASE_URL;

// ------------------------- CREATE SHORT LINK ----------------------------
exports.create = async (req, res) => {
  try {
    const { urls, chainNote, folderName } = req.body;
    const userId = req.user._id;

    if (!urls || urls.length < 1) {
      return res.status(400).json({ message: "At least one URL is required" });
    }

    const slugs = urls.map(() => nanoid(6));
    const chainGroupId = urls.length > 1 ? nanoid(8) : null; // 🔥 ONE GROUP ID
    let results = [];

    for (let i = 0; i < urls.length; i++) {
      const payload = {
        originalUrl: urls[i],
        slug: slugs[i],
        shortUrl: `${BASE}/${slugs[i]}`,
        createdBy: userId,
        folderName: folderName || null,
        chainNextSlug: slugs[i + 1] || null,
        chainNote: i === 0 ? chainNote || null : null,
        chainGroupId: chainGroupId,
      };

      const link = await CreateLink.create(payload);
      results.push(link);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



// ---------------------------- REDIRECT ------------------------------
exports.redirect = async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await CreateLink.findOne({ slug });

    if (!link) return res.status(404).send("Link not found");

    let sessionId = req.cookies?.track || crypto.randomUUID();
    res.cookie("track", sessionId, { httpOnly: true, maxAge: 7 * 86400000 });

    const ua = new UAParser(req.headers["user-agent"]);
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "Unknown";

    ip = ip.replace("::ffff:", "").trim();

    const localIps = ["127.0.0.1", "::1", "localhost"];
    let country = "Unknown";

     if (localIps.includes(ip)) {
      country = "Localhost";
    } else {
      try {
        const geo = geoip.lookup(ip);
        country = geo?.country || "Unknown"; 
      } catch (e) {
        country = "Lookup Failed";
      }
    }

    const previousSteps = await CreateLinkAnalytics.countDocuments({ sessionId });

    await CreateLinkAnalytics.create({
      slug,
      rootSlug: link.chainGroupId || slug, // important for funnel grouping
      sessionId,
      step: previousSteps + 1,
      ip,
      country,
      device: ua.getDevice().type || "Desktop",
      browser: ua.getBrowser().name || "Unknown",
      os: ua.getOS().name || "Unknown",
      timestamp: new Date()
    });

    link.clicks++;
    await link.save();

    // Chain logic
    if (link.chainNextSlug) {
      return res.redirect(`${BASE}/${link.chainNextSlug}`);
    }

    return res.redirect(link.originalUrl);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

// ---------------------------- UPDATE CHAIN ------------------------------
exports.updateChain = async (req, res) => {
  try {
    const { slug } = req.params;
    const { nextSlug } = req.body;

    const link = await CreateLink.findOne({ slug });
    if (!link) return res.status(404).json({ message: "Link not found" });

    link.chainNextSlug = nextSlug || null;
    await link.save();

    res.json(link);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------- USER LINKS WITH CHAIN PATH -----------------------
exports.getAllLinks = async (req, res) => {
  try {
    const userId = req.user._id;
    const links = await CreateLink.find({ createdBy: userId });
    
    let singleLinks = [];
    let chainGroups = {};
    let folderGroups = {};
    let folders = new Set();

    for (let link of links) {
       if (link.folderName) {
        folders.add(link.folderName);
        if (!folderGroups[link.folderName]) folderGroups[link.folderName] = [];
        folderGroups[link.folderName].push(link);
      }

      if (!link.chainGroupId) {
        singleLinks.push(link);  // real singles
      } else {
        if (!chainGroups[link.chainGroupId]) chainGroups[link.chainGroupId] = [];
        chainGroups[link.chainGroupId].push(link);
      }
    }

    // Sort chain items in order
    for (let groupId in chainGroups) {
      const chain = chainGroups[groupId];
      
      chainGroups[groupId] = chain.sort((a, b) => {
        if (a.chainNextSlug === b.slug) return 1;
        if (b.chainNextSlug === a.slug) return -1;
        return 0;
      });
    }

     for (let folderName in folderGroups) {
      folderGroups[folderName] = folderGroups[folderName].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.json({
      singleLinks,
      chainGroups,
      folderGroups,
      folders: Array.from(folders),
    });

  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAllFolders = async (req, res) => {
  try {
    const folders = await CreateLink.distinct("folderName", {
      createdBy: req.user._id,
      folderName: { $ne: null }
    });

    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
};


// ---------------------------- ANALYTICS ----------------------------
exports.analytics = async (req, res) => {
  try {
    const slug = req.params.slug;
    const data = await CreateLinkAnalytics.find({ slug }).sort({ timestamp: -1 });
    res.json(data);
  } catch {
    res.status(500).json({ message: "Error fetching analytics" });
  }
};

// DAILY ANALYTICS
exports.dailyAnalytics = async (req, res) => {
  try {
    const slug = req.params.slug;

    const daily = await CreateLinkAnalytics.aggregate([
      { $match: { slug } },

      // Convert timestamp → YYYY-MM-DD
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(
      daily.map(d => ({
        date: d._id,
        clicks: d.clicks
      }))
    );
  } catch {
    res.status(500).json({ message: "Error fetching daily analytics" });
  }
};


// --------------------------- FUNNEL ------------------------------
    // /api/funnel/:slug
 exports.funnel = async (req, res) => {
  try {
    const slug = req.params.slug;

    const funnelData = await CreateLinkAnalytics.aggregate([
      { $match: { rootSlug: slug } },
      {
        $group: {
          _id: { step: "$step", slug: "$slug" },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { "_id.step": 1 } }
    ]);

    res.json(
      funnelData.map((i) => ({
        step: i._id.step,
        slug: i._id.slug,
        clicks: i.clicks
      }))
    );
  } catch {
    res.status(500).json({ message: "Error generating funnel" });
  }
};

// ---------------------------- DELETE CHAIN ------------------------------
exports.deleteChain = async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await CreateLink.deleteMany({ chainGroupId: groupId });
    if (result.deletedCount > 0) {
      return res.status(200).json({ message: "Chain deleted successfully!" });
    } else {
      return res.status(404).json({ message: "Chain not found!" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------- DELETE SINGLE LINK ------------------------------
exports.deleteLink = async (req, res) => {
  try {
    const { slug } = req.params;
    const deletedLink = await CreateLink.findOneAndDelete({ slug });
    if (!deletedLink) {
      return res.status(404).json({ message: "Link not found" });
    }

    res.json({ message: `Link with slug ${slug} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



exports.getLinkBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const link = await CreateLink.findOne({ slug });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    res.json(link);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};