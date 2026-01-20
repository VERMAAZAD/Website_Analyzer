  const HostingInfo = require("../Models/HostingInfo");

  // Add Hosting Info
exports.addHostingInfo = async (req, res) => {
  try {
    const { email, server, platform } = req.body;

    if (!email || !server || !platform) {
      return res.status(400).json({ success: false, message: "Email, server and platform are required" });
    }

    // 🧠 Determine ownership based on role
    let ownerId;
    if (req.user.role === "admin" && req.body.user) {
      ownerId = req.body.user;
    } else if (req.user.role === "sub-user") {
      ownerId = req.user.parentUser; // Belongs to parent user
    } else {
      ownerId = req.user._id; 
    }

    // 🔍 Check for existing entry under this owner (unless admin)
    const query = {
      email: email.trim().toLowerCase(),
      server: server.trim().toLowerCase(),
      platform: platform.trim().toLowerCase(),
    };
    if (ownerId) query.user = ownerId;

    const existing = await HostingInfo.findOne(query);

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

    // 💾 Save new record
    const hostingInfo = new HostingInfo({
      ...req.body,
      email: email.trim().toLowerCase(),
      server: server.trim().toLowerCase(),
      user: ownerId || req.user._id, // For admin, optional
    });

    await hostingInfo.save();
    res.json({ success: true, data: hostingInfo });
  } catch (error) {
    console.error("Error adding hosting info:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


  const ScrapedDatingSite = require("../Models/ScrapedDatingSite");
  const ScrapedGameSite = require("../Models/ScrapedGameSite");
  const ScrapedSite = require("../Models/ScrapedSite");

exports.getHostingList = async (req, res) => {
  try {
    // ================= 1️⃣ Ownership Filter =================
    let filter = {};
    if (req.user.role === "admin") {
      filter = {};
    } else if (req.user.role === "sub-user") {
      filter = { user: req.user.parentUser };
    } else {
      filter = { user: req.user._id };
    }

    // ================= 2️⃣ Fetch HostingInfo (Servers) =================
    const hostingInfos = await HostingInfo.find(filter).lean();

    // ================= 3️⃣ Fetch Scraped Domain Data =================
    const [dating, games, sites] = await Promise.all([
      ScrapedDatingSite.find(filter, { domain: 1, hostingInfo: 1 }).lean(),
      ScrapedGameSite.find(filter, { domain: 1, hostingInfo: 1 }).lean(),
      ScrapedSite.find(filter, { domain: 1, hostingInfo: 1 }).lean(),
    ]);

    // Flatten scraped hostingInfo
    const scrapedDomains = [...dating, ...games, ...sites]
      .filter(d => d.hostingInfo && d.domain)
      .map(d => ({
        domain: d.domain.trim(),
        platform: d.hostingInfo.platform?.trim(),
        email: d.hostingInfo.email?.trim(),
        server: d.hostingInfo.server?.trim() || null,
      }));

    // ================= 4️⃣ Combine HostingInfo + Scraped Domains =================
    const allRecords = [
      ...hostingInfos.map(h => ({
        domain: h.domain?.trim(),
        platform: h.platform?.trim(),
        email: h.email?.trim(),
        server: h.server?.trim() || null,
      })),
      ...scrapedDomains,
    ].filter(r => r.domain && r.platform && r.email && r.email !== "-");

    // ================= 5️⃣ Aggregate by platform + email =================
    const map = new Map();

    // Add servers (HostingInfo ONLY)
    hostingInfos.forEach(h => {
      if (!h.platform || !h.email) return;

      const key = `${h.platform.toLowerCase()}|${h.email.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          platform: h.platform,
          email: h.email,
          servers: new Set(),
          domains: new Set(),
        });
      }

      if (h.server) {
        map.get(key).servers.add(h.server.trim());
      }
    });

    // Add domains (All records)
    allRecords.forEach(r => {
      const key = `${r.platform.toLowerCase()}|${r.email.toLowerCase()}`;
      if (!map.has(key)) return;
      map.get(key).domains.add(r.domain);
    });

    // ================= 6️⃣ Final summary list =================
    const list = Array.from(map.values()).map(item => ({
      platform: item.platform,
      email: item.email,
      serverCount: item.servers.size,
      domainCount: item.domains.size,
    }));

    // ================= 7️⃣ Server-level list (for Show Servers page) =================
    const servers = hostingInfos
      .filter(h => h.server && h.server.trim() !== "")
      .map(h => {
          // count domains for this server
          const domainCount = allRecords.filter(
            r =>
              r.platform.toLowerCase() === h.platform.toLowerCase() &&
              r.email.toLowerCase() === h.email.toLowerCase() &&
              r.server === h.server &&
              r.domain
          ).length;

          return {
            _id: h._id,
            platform: h.platform,
            email: h.email,
            server: h.server,
            ServerExpiryDate: h.ServerExpiryDate,
            domainCount,
          };
        });

    // ================= 8️⃣ Response =================
    res.json({
      success: true,
      list,     // platform + email summary
      servers,  // server-level (Show Servers)
      all: allRecords, // domain-level (Show Domains)
    });

  } catch (error) {
    console.error("Error in getHostingList:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load hosting list",
    });
  }
};



exports.updateHostingInfoEverywhere = async (req, res) => {
  try {
    const { email, platform, server, updates } = req.body;

    if (!email || !platform) {
      return res.status(400).json({
        success: false,
        message: "Email and Platform are required",
      });
    }

    // Build filter
    let filter = { email, platform };
    if (server) filter.server = server;

    if (req.user.role === "user") filter.user = req.user._id;
    else if (req.user.role === "sub-user") filter.user = req.user.parentUser;
    // admin → no extra filter

    // Update HostingInfo
    const hostingUpdateResult = await HostingInfo.updateMany(filter, { $set: updates });

    // Prepare updates for embedded hostingInfo in scraped models
    const updateObj = {};
    for (let key in updates) {
      if (updates[key] !== undefined) updateObj[`hostingInfo.${key}`] = updates[key];
    }

    // Build filter for embedded models
    let filterScraped = { "hostingInfo.email": email, "hostingInfo.platform": platform };
    if (server) filterScraped["hostingInfo.server"] = server;

    if (req.user.role === "user") filterScraped.user = req.user._id;
    else if (req.user.role === "sub-user") filterScraped.user = req.user.parentUser;
    // admin → no extra filter

    // Update embedded models
    await Promise.all([
      ScrapedDatingSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedGameSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedSite.updateMany(filterScraped, { $set: updateObj }),
    ]);

    if (hostingUpdateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching hosting records found or insufficient permission",
      });
    }

    res.json({ success: true, message: "Hosting info updated everywhere" });
  } catch (error) {
    console.error("Error in updateHostingInfoEverywhere:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Update Server name everywhere (by email)
exports.updateServerEverywhere = async (req, res) => {
  try {
    const { email, platform, oldServer, newServer, ServerExpiryDate } = req.body;

    if (!email || !oldServer || !newServer) {
      return res.status(400).json({
        success: false,
        message: "Email, oldServer, and newServer are required",
      });
    }

    // 🧠 Determine ownership filter
    let filter = { email, platform, server: oldServer };
    if (req.user.role === "user") {
      filter.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      filter.user = req.user.parentUser;
    }
    // admin → no additional filter needed

    // 1️⃣ Update HostingInfo
    const hostingUpdateResult = await HostingInfo.updateMany(filter, {
      $set: { server: newServer, ServerExpiryDate },
    });

    // 2️⃣ Prepare updates for scraped models
    const updateObj = { "hostingInfo.server": newServer };
    if (ServerExpiryDate) updateObj["hostingInfo.ServerExpiryDate"] = ServerExpiryDate;

    let filterScraped = { "hostingInfo.email": email, "hostingInfo.platform": platform, "hostingInfo.server": oldServer };
    if (req.user.role === "user") filterScraped.user = req.user._id;
    else if (req.user.role === "sub-user") filterScraped.user = req.user.parentUser;

    await Promise.all([
      ScrapedDatingSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedGameSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedSite.updateMany(filterScraped, { $set: updateObj }),
    ]);

    // Check if anything was actually updated
    if (hostingUpdateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching server records found or insufficient permission",
      });
    }

    res.json({ success: true, message: "Server updated everywhere" });
  } catch (err) {
    console.error("Error in updateServerEverywhere:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update server + expiry date by id
exports.updateServerInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { server, ServerExpiryDate } = req.body;

    // 🧠 Build filter based on role
    let filter = { _id: id };
    if (req.user.role === "user") {
      filter.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      filter.user = req.user.parentUser;
    }
    // admin → no additional filter needed

    // 1️⃣ Update HostingInfo
    const hostingUpdate = await HostingInfo.findOneAndUpdate(
      filter,
      { server, ServerExpiryDate },
      { new: true }
    );

    if (!hostingUpdate) {
      return res.status(404).json({
        success: false,
        message: "Hosting info not found or insufficient permission",
      });
    }

    // 2️⃣ Update embedded hostingInfo in Scraped models
    const scrapedFilter = { "hostingInfo._id": id };
    if (req.user.role === "user") scrapedFilter.user = req.user._id;
    else if (req.user.role === "sub-user") scrapedFilter.user = req.user.parentUser;

    const updateObj = {
      "hostingInfo.server": server,
      "hostingInfo.ServerExpiryDate": ServerExpiryDate,
    };

    await Promise.all([
      ScrapedDatingSite.updateMany(scrapedFilter, { $set: updateObj }),
      ScrapedGameSite.updateMany(scrapedFilter, { $set: updateObj }),
      ScrapedSite.updateMany(scrapedFilter, { $set: updateObj }),
    ]);

    res.json({ success: true, message: "Server info updated successfully", data: hostingUpdate });
  } catch (err) {
    console.error("Error in updateServerInfo:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.catheServerData = async (req, res) => {
  try {
    const { server, platform, email } = req.params;

    if (!server || !platform || !email) {
      return res.status(400).json({
        success: false,
        message: "server, platform and email are required",
      });
    }

    // 🔹 Base filter (CRITICAL FIX)
    let filter = {
      server,
      platform,
      email,
    };

    // 🔹 Role-based access
    if (req.user.role === "user") {
      filter.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      filter.user = req.user.parentUser;
    }
    // admin → no user filter

    const hostingInfo = await HostingInfo.findOne(filter);

    if (!hostingInfo) {
      return res.status(404).json({
        success: false,
        message: "Server not found or insufficient permission",
      });
    }

    res.json({
      success: true,
      platform: hostingInfo.platform,
      email: hostingInfo.email,
      server: hostingInfo.server,
      ServerExpiryDate: hostingInfo.ServerExpiryDate,
    });
  } catch (err) {
    console.error("❌ Error in catheServerData:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};



// ✅ Get expiring servers (within 10 days)
exports.getExpiringServers = async (req, res) => {
  try {
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);

    // 🔹 Role-based filtering
    let query = {};
    if (req.user.role === "user") {
      query.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      query.user = req.user.parentUser; // sub-user sees parent user's servers
    }
    // admin → query stays empty, fetch all

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

    res.json({ success: true, servers: expiring }); // added success flag
  } catch (err) {
    console.error("Error fetching expiring servers:", err);
    res.status(500).json({ success: false, error: "Failed to fetch expiring servers" });
  }
};



// ✅ Renew servers
 exports.renewServer = async (req, res) => {
  try {
    const { servers } = req.body;

    if (!Array.isArray(servers) || servers.length === 0) {
      return res.status(400).json({ success: false, error: "Expected non-empty array of server IDs" });
    }

    const results = await Promise.all(
      servers.map(async (serverId) => {
        // 🔹 Role-based query
        let query = { _id: serverId };
        if (req.user.role === "user") {
          query.user = req.user._id;
        } else if (req.user.role === "sub-user") {
          query.user = req.user.parentUser; // sub-user sees parent user's servers
        }
        // admin → no additional filter

        const existing = await HostingInfo.findOne(query);

        if (!existing) {
          return { serverId, status: "not found" };
        }

        // 🔹 Extend expiry by 1 year
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
      success: true,
      message: "Server renewal process completed",
      results
    });
  } catch (err) {
    console.error("Server renewal error:", err);
    res.status(500).json({ success: false, error: "Server renewal failed", details: err.message });
  }
};


// DELETE a server by ID
exports.deleteServer = async (req, res) => {
  try {
    const { email, server, platform } = req.body;

    if (!email || !server) {
      return res.status(400).json({
        success: false,
        message: "Email and server name are required",
      });
    }

    // ================= ROLE BASED QUERY =================
    let userQuery = {};
    if (req.user.role === "user") {
      userQuery.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      userQuery.user = req.user.parentUser;
    }
    // admin → unrestricted

    // ================= VERIFY SERVER EXISTS =================
    const exists = await HostingInfo.findOne({
      email,
      server,
      platform,
      ...userQuery,
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Server not found or not authorized",
      });
    }

    // ================= DELETE ALL HOSTINGINFO RECORDS =================
    const deleteResult = await HostingInfo.deleteMany({
      email,
      server,
      platform,
      ...userQuery,
    });

    // ================= CLEAR HOSTING INFO FROM SCRAPED SITES =================
    const unsetHostingInfo = {
      $unset: {
        "hostingInfo.platform": "",
        "hostingInfo.server": "",
        "hostingInfo.email": "",
      },
    };

    const [sites, gameSites, datingSites] = await Promise.all([
      ScrapedSite.updateMany(
        { "hostingInfo.server": server, "hostingInfo.email": email },
        unsetHostingInfo
      ),
      ScrapedGameSite.updateMany(
        { "hostingInfo.server": server, "hostingInfo.email": email },
        unsetHostingInfo
      ),
      ScrapedDatingSite.updateMany(
        { "hostingInfo.server": server, "hostingInfo.email": email },
        unsetHostingInfo
      ),
    ]);

    res.json({
      success: true,
      message: `Server '${server}' deleted successfully`,
      stats: {
        hostingInfoDeleted: deleteResult.deletedCount,
        scrapedSitesUpdated: sites.modifiedCount,
        scrapedGameSitesUpdated: gameSites.modifiedCount,
        scrapedDatingSitesUpdated: datingSites.modifiedCount,
      },
    });
  } catch (err) {
    console.error("❌ Error deleting server:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete server",
      error: err.message,
    });
  }
};


exports.getServersByEmailPlatform = async (req, res) => {
  try {
    const { email, platform } = req.params;

    const normalize = v => v.trim().toLowerCase();

    let filter = {
      email: normalize(email),
      platform: normalize(platform),
    };

    if (req.user.role === "user") {
      filter.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      filter.user = req.user.parentUser;
    }

    // 🔥 SINGLE SOURCE → HostingInfo ONLY
    const records = await HostingInfo.find(filter);

    const serverMap = new Map();

    records.forEach(r => {
      if (!r.server) return;

      if (!serverMap.has(r.server)) {
        serverMap.set(r.server, {
          server: r.server,
          platform: r.platform,
          domainCount: 0,
          ServerExpiryDate: r.ServerExpiryDate || null,
        });
      }

      if (r.domain && r.domain !== "-") {
        serverMap.get(r.server).domainCount += 1;
      }
    });

    res.json({
      success: true,
      servers: Array.from(serverMap.values()),
    });

  } catch (err) {
    console.error("getServersByEmailPlatform error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


