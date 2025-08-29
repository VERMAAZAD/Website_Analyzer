  const HostingInfo = require("../Models/HostingInfo");

  // Add Hosting Info
exports.addHostingInfo = async (req, res) => {
  try {
    const { email, server } = req.body;

    // 🔍 check if server already exists for this email
    const existing = await HostingInfo.findOne({
      email: email.trim().toLowerCase(),
      server: server.trim().toLowerCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Server already exists for this email`,
        existing: {
          email: existing.email,
          platform: existing.platform,
          server: existing.server,
        },
      });
    }

    // save new
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

    // 1. Get standalone HostingInfo (the "master" records for platform/email/issueDate)
    const standalone = await HostingInfo.find(filter).sort({ createdAt: -1 });

    // 2. Collect embedded hostingInfo from scraped models
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
        ...site.hostingInfo,
      }));

    // 3. Combine all records (for counts)
    const allRecords = [
      ...standalone.map(info => ({
        _id: info._id,
        domain: info.domain,
        platform: info.platform,
        email: info.email,
        server: info.server,
        ServerExpiryDate: info.ServerExpiryDate,
      })),
      ...embeddedData,
    ].filter(item => item.email && item.email.trim() !== "" && item.email !== "-");

    // 4. Build response list — only from HostingInfo, but with counts
    const list = standalone.map(info => {
      const relatedRecords = allRecords.filter(
        r =>
          r.email.toLowerCase() === info.email.toLowerCase() &&
          (r.platform || "").toLowerCase() === (info.platform || "").toLowerCase()
      );

      const serverCount = new Set(relatedRecords.map(r => r.server).filter(Boolean)).size;
      const domainCount = relatedRecords.filter(
        r => r.domain && r.domain.trim() !== "" && r.domain !== "-"
      ).length;

      return {
        email: info.email,
        platform: info.platform,
        serverCount,
        domainCount,
      };
    });

      const hostingServers = standalone
      .filter(h => h.server && h.server.trim() !== "")
      .map(h => ({
        _id: h._id,
        email: h.email,
        server: h.server,
        ServerExpiryDate: h.ServerExpiryDate,
      }));


    res.json({
      success: true,
      list,      
      all: allRecords, 
      servers: hostingServers,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update Hosting Info everywhere (HostingInfo + Scraped Models)
exports.updateHostingInfoEverywhere = async (req, res) => {
  try {
    const { email, platform, updates } = req.body;

    if (!email || !platform) {
      return res.status(400).json({ success: false, message: "Email and Platform are required" });
    }

    // 1. Update in HostingInfo
    await HostingInfo.updateMany(
      { email, platform },  
      { $set: updates }
    );

    // 2. Prepare updates for embedded hostingInfo
    const updateObj = {};
    for (let key in updates) {
      if (updates[key] !== undefined) {
        updateObj[`hostingInfo.${key}`] = updates[key];
      }
    }

    // 3. Update in Scraped Models
    const filterScraped = { 
      "hostingInfo.email": email, 
      "hostingInfo.platform": platform 
    };

    await Promise.all([
      ScrapedDatingSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedGameSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedSite.updateMany(filterScraped, { $set: updateObj }),
    ]);

    res.json({ success: true, message: "Hosting info updated everywhere" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Server name everywhere (by email)
exports.updateServerEverywhere = async (req, res) => {
  try {
    const { email, oldServer, newServer, ServerExpiryDate } = req.body;

    if (!email || !oldServer || !newServer) {
      return res.status(400).json({ success: false, message: "Email, oldServer, and newServer are required" });
    }

    // 1. Update in HostingInfo
    await HostingInfo.updateMany(
      { email, server: oldServer },
      { $set: { server: newServer, ServerExpiryDate } }
    );

    // 2. Update in Scraped models
    const updateObj = {
      "hostingInfo.server": newServer,
    };
    if (ServerExpiryDate) updateObj["hostingInfo.ServerExpiryDate"] = ServerExpiryDate;

    const filterScraped = {
      "hostingInfo.email": email,
      "hostingInfo.server": oldServer,
    };

    await Promise.all([
      ScrapedDatingSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedGameSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedSite.updateMany(filterScraped, { $set: updateObj }),
    ]);

    res.json({ success: true, message: "Server updated everywhere" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update server + expiry date by id
exports.updateServerInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { server, ServerExpiryDate } = req.body;

    // Update HostingInfo
    await HostingInfo.findByIdAndUpdate(id, { server, ServerExpiryDate });

    // Also update in Scraped models if embedded
    await Promise.all([
      ScrapedDatingSite.updateMany({ "hostingInfo._id": id }, {
        $set: { "hostingInfo.server": server, "hostingInfo.ServerExpiryDate": ServerExpiryDate }
      }),
      ScrapedGameSite.updateMany({ "hostingInfo._id": id }, {
        $set: { "hostingInfo.server": server, "hostingInfo.ServerExpiryDate": ServerExpiryDate }
      }),
      ScrapedSite.updateMany({ "hostingInfo._id": id }, {
        $set: { "hostingInfo.server": server, "hostingInfo.ServerExpiryDate": ServerExpiryDate }
      }),
    ]);

    res.json({ success: true, message: "Server info updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



  exports.catheServerData = async (req, res) => {
  try {
    const { server } = req.params;
    const hostingInfo = await HostingInfo.findOne({ server });

    if (!hostingInfo) {
      return res.status(404).json({ message: "Server not found" });
    }

    res.json({
      platform: hostingInfo.platform,
      email: hostingInfo.email,
      server: hostingInfo.server,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




// ✅ Get expiring servers (within 10 days)
exports.getExpiringServers = async (req, res) => {
  try {
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);

    // Admin can see all, normal users only their own
    const query = req.user.role === "admin" ? {} : { user: req.user._id };

    const servers = await HostingInfo.find(query);

    const expiring = [];
    const expiredServers = [];

    servers.forEach(server => {
      if (!server.ServerExpiryDate) return;

      const expiryDate = new Date(server.ServerExpiryDate);

      if (expiryDate >= now && expiryDate <= tenDaysFromNow) {
        expiring.push(server);
      } else if (expiryDate < now) {
        expiredServers.push(server._id);
      }
    });

    if (expiredServers.length > 0) {
      await HostingInfo.deleteMany({ _id: { $in: expiredServers } });
    }

    res.json({ servers: expiring }); // 👈 match frontend `res.data.servers`
  } catch (err) {
    console.error("Error fetching expiring servers:", err);
    res.status(500).json({ error: "Failed to fetch expiring servers" });
  }
};


// ✅ Renew servers
exports.renewServer = async (req, res) => {
  try {
    const { servers } = req.body;

    if (!Array.isArray(servers) || servers.length === 0) {
      return res.status(400).json({ error: "Expected non-empty array of server IDs" });
    }

    const results = await Promise.all(
      servers.map(async (serverId) => {
        const query = req.user.role === "admin"
          ? { _id: serverId }
          : { _id: serverId, user: req.user._id };

        const existing = await HostingInfo.findOne(query);

        if (!existing) {
          return { serverId, status: "not found" };
        }

        let newExpiryDate;
        if (existing.ServerExpiryDate) {
          newExpiryDate = new Date(existing.ServerExpiryDate);
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
        } else {
          newExpiryDate = new Date();
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
        }

        existing.ServerExpiryDate = newExpiryDate;
        await existing.save();

        return { serverId, status: "renewed", newExpiryDate };
      })
    );

    res.json({
      message: "Server renewal process completed",
      results
    });
  } catch (err) {
    console.error("Server renewal error:", err);
    res.status(500).json({ error: "Server renewal failed", details: err.message });
  }
};

// DELETE a server by ID
exports.deleteServer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Server ID is required" });
    }

    // Admin can delete any; user can delete only their own
    const query = req.user.role === "admin" ? { _id: id } : { _id: id, user: req.user._id };

    // Find server first
    const serverDoc = await HostingInfo.findOne(query);
    if (!serverDoc) {
      return res.status(404).json({ success: false, message: "Server not found or not authorized" });
    }

    const serverName = serverDoc.server;

    // Delete from HostingInfo
    await HostingInfo.deleteOne({ _id: serverDoc._id });

    // Remove only hostingInfo.platform, hostingInfo.server, hostingInfo.email
    const update = {
      $unset: {
        "hostingInfo.platform": "",
        "hostingInfo.server": "",
        "hostingInfo.email": "",
      },
    };

    const updatedResults = await Promise.all([
      ScrapedSite.updateMany({ "hostingInfo.server": serverName }, update),
      ScrapedGameSite.updateMany({ "hostingInfo.server": serverName }, update),
      ScrapedDatingSite.updateMany({ "hostingInfo.server": serverName }, update),
    ]);

    res.json({
      success: true,
      message: `Server '${serverName}' deleted from HostingInfo and hostingInfo fields cleared from related sites`,
      updates: {
        scrapedSitesModified: updatedResults[0].modifiedCount,
        scrapedGameSitesModified: updatedResults[1].modifiedCount,
        scrapedDatingSitesModified: updatedResults[2].modifiedCount,
      },
    });
  } catch (err) {
    console.error("❌ Error deleting server:", err);
    res.status(500).json({ success: false, message: "Failed to delete server" });
  }
};
