const { nanoid } = require("nanoid");
const CreateLink = require("../Models/CreateLink");
const CreateLinkAnalytics = require("../Models/CreateLinkAnalytics");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

const BASE = process.env.BASE_URL;

exports.create = async (req, res) => {
  try {
    const { url, customSlug } = req.body;
    if (!url) return res.status(400).json({ message: "URL required" });

    const slug = customSlug || nanoid(6);

    const exists = await CreateLink.findOne({ slug });
    if (exists) return res.status(409).json({ message: "Slug already exists" });

    const shortUrl = `${BASE}/${slug}`;

    const link = await CreateLink.create({ originalUrl: url, slug, shortUrl });

    res.json(link);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.redirect = async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await CreateLink.findOne({ slug });

    if (!link) return res.status(404).send("Link not found");

    link.clicks++;
    await link.save();

    // Analytics
    const ua = new UAParser(req.headers["user-agent"]);
    const geo = geoip.lookup(req.ip);

    await CreateLinkAnalytics.create({
      slug,
      ip: req.ip,
      country: geo?.country || "Unknown",
      device: ua.getDevice().type || "Desktop",
      browser: ua.getBrowser().name,
      os: ua.getOS().name
    });

    return res.redirect(link.originalUrl);

  } catch (err) {
    res.status(500).send("Server Error");
  }
};

exports.analytics = async (req, res) => {
  const slug = req.params.slug;
  const data = await CreateLinkAnalytics.find({ slug }).sort({ timestamp: -1 });
  res.json(data);
};
