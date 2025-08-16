const HostingInfo = require("../Models/HostingInfo");

// Add Hosting Info
exports.addHostingInfo = async (req, res) => {
  try {
    const hostingInfo = new HostingInfo({ ...req.body, user: req.user._id });
    await hostingInfo.save();
    res.json({ success: true, data: hostingInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const ScrapedDatingSite = require("../Models/ScrapedDatingSite");
const ScrapedGameSite = require("../Models/ScrapedGameSite");
const ScrapedSite = require("../Models/ScrapedSite");

exports.getHostingList = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };

    // Standalone hosting info
    const standalone = await HostingInfo.find(filter).sort({ createdAt: -1 });

    // Embedded hosting info
    const sources = [
      await ScrapedDatingSite.find(filter, { domain: 1, hostingInfo: 1 }),
      await ScrapedGameSite.find(filter, { domain: 1, hostingInfo: 1 }),
      await ScrapedSite.find(filter, { domain: 1, hostingInfo: 1 }),
    ];

    const embeddedData = sources
      .flat()
      .filter(site => site.hostingInfo && Object.keys(site.hostingInfo).length > 0)
      .map(site => ({
        _id: site._id,
        domain: site.domain,
        ...site.hostingInfo
      }));

    // All records (for View Domains popup)
    const allRecords = [
      ...standalone.map(info => ({
        _id: info._id,
        domain: info.domain || "-",
        platform: info.platform,
        email: info.email,
        server: info.server,
        domainPlatform: info.domainPlatform,
        domainEmail: info.domainEmail,
        cloudflare: info.cloudflare,
        hostingIssueDate: info.hostingIssueDate
      })),
      ...embeddedData
    ];

    // Deduplicated version for the main table
    const uniqueMap = new Map();
    allRecords.forEach(item => {
      const key = `${item.email || ""}|${item.server || ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    res.json({
      success: true,
      list: [...uniqueMap.values()], // For table display
      all: allRecords                // For popup full domain list
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

