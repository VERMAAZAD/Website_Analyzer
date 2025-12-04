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
    const { urls, chainNote } = req.body;
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

        chainNextSlug: slugs[i + 1] || null,
        chainNote: i === 0 ? chainNote || null : null,
        chainGroupId: chainGroupId // 🔥 Add group ID to ALL chain links
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
    const geo = geoip.lookup(req.ip);

    const previousSteps = await CreateLinkAnalytics.countDocuments({ sessionId });

    await CreateLinkAnalytics.create({
      slug,
      sessionId,
      step: previousSteps + 1,
      ip: req.ip,
      country: geo?.country || "Unknown",
      device: ua.getDevice().type || "Desktop",
      browser: ua.getBrowser().name,
      os: ua.getOS().name
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

    for (let link of links) {
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

    res.json({ singleLinks, chainGroups });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};



function buildChain(all, slug) {
  let path = [slug];
  let current = all.find(l => l.slug === slug);

  while (current?.chainNextSlug) {
    path.push(current.chainNextSlug);
    current = all.find(l => l.slug === current.chainNextSlug);
  }

  return path;
}

// ---------------------------- ANALYTICS ----------------------------
exports.analytics = async (req, res) => {
  const slug = req.params.slug;
  const data = await CreateLinkAnalytics.find({ slug });
  res.json(data);
};

// --------------------------- FUNNEL ------------------------------
exports.funnel = async (req, res) => {
  const data = await CreateLinkAnalytics.aggregate([
    { $group: { _id: "$step", clicks: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  res.json(data);
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
