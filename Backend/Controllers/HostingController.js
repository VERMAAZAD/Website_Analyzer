  const HostingInfo = require("../Models/HostingInfo");

  // Add Hosting Info
exports.addHostingInfo = async (req, res) => {
  try {
    const { email, server } = req.body;

    if (!email || !server) {
      return res.status(400).json({ success: false, message: "Email and server are required" });
    }

    // 🧠 Determine ownership based on role
    let ownerId;
    if (req.user.role === "admin") {
      ownerId = null; // Admin can add for anyone (optional: use req.body.user if provided)
    } else if (req.user.role === "sub-user") {
      ownerId = req.user.parentUser; // Belongs to parent user
    } else {
      ownerId = req.user._id; // Belongs to user
    }

    // 🔍 Check for existing entry under this owner (unless admin)
    const query = {
      email: email.trim().toLowerCase(),
      server: server.trim().toLowerCase(),
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
    // 🧠 Determine ownership scope
    let filter = {};

    if (req.user.role === "admin") {
      filter = {}; // Admin sees everything
    } else if (req.user.role === "sub-user") {
      filter = { user: req.user.parentUser }; // Sub-user sees parent’s data
    } else {
      filter = { user: req.user._id }; // Normal user sees own data
    }

    // 1️⃣ Get standalone HostingInfo (main records)
    const standalone = await HostingInfo.find(filter).sort({ createdAt: -1 });

    // 2️⃣ Collect embedded hostingInfo from scraped models
    const sources = [
      await ScrapedDatingSite.find(filter, { domain: 1, hostingInfo: 1 }),
      await ScrapedGameSite.find(filter, { domain: 1, hostingInfo: 1 }),
      await ScrapedSite.find(filter, { domain: 1, hostingInfo: 1 }),
    ];

    // 3️⃣ Flatten and clean embedded hosting info
    const embeddedData = sources
      .flat()
      .filter(site => site.hostingInfo && Object.keys(site.hostingInfo).length > 0)
      .map(site => ({
        _id: site._id,
        domain: site.domain,
        ...site.hostingInfo,
      }));

    // 4️⃣ Combine standalone + embedded
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

    // 5️⃣ Build aggregated list
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

    // 6️⃣ Extract servers for quick lookup
    const hostingServers = standalone
      .filter(h => h.server && h.server.trim() !== "")
      .map(h => ({
        _id: h._id,
        email: h.email,
        server: h.server,
        ServerExpiryDate: h.ServerExpiryDate,
      }));

    // ✅ Final response
    res.json({
      success: true,
      list,
      all: allRecords,
      servers: hostingServers,
    });

  } catch (error) {
    console.error("Error in getHostingList:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// Update Hosting Info everywhere (HostingInfo + Scraped Models)
exports.updateHostingInfoEverywhere = async (req, res) => {
  try {
    const { email, platform, updates } = req.body;

    if (!email || !platform) {
      return res.status(400).json({
        success: false,
        message: "Email and Platform are required",
      });
    }

    // 🧠 Determine scope filter based on role
    let filter = {};
    if (req.user.role === "admin") {
      // Admin → full access
      filter = { email, platform };
    } else if (req.user.role === "sub-user") {
      // Sub-user → access to parent’s data
      filter = { email, platform, user: req.user.parentUser };
    } else {
      // Regular user → only their own data
      filter = { email, platform, user: req.user._id };
    }

    // 🧩 Update HostingInfo (main collection)
    const hostingUpdateResult = await HostingInfo.updateMany(filter, { $set: updates });

    // 🧱 Prepare updates for embedded hostingInfo
    const updateObj = {};
    for (let key in updates) {
      if (updates[key] !== undefined) {
        updateObj[`hostingInfo.${key}`] = updates[key];
      }
    }

    // 📂 Build filter for embedded hostingInfo updates
    let filterScraped = {
      "hostingInfo.email": email,
      "hostingInfo.platform": platform,
    };

    // Apply ownership scope for embedded models
    if (req.user.role === "admin") {
      // No extra filter needed
    } else if (req.user.role === "sub-user") {
      filterScraped.user = req.user.parentUser;
    } else {
      filterScraped.user = req.user._id;
    }

    // 🧾 Update all scraped models that embed hostingInfo
    const results = await Promise.all([
      ScrapedDatingSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedGameSite.updateMany(filterScraped, { $set: updateObj }),
      ScrapedSite.updateMany(filterScraped, { $set: updateObj }),
    ]);

    // ✅ If nothing matched in HostingInfo or scraped models, tell the user
    const totalModified =
      hostingUpdateResult.modifiedCount +
      results.reduce((sum, r) => sum + (r.modifiedCount || 0), 0);

    if (totalModified === 0) {
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
    const { email, oldServer, newServer, ServerExpiryDate } = req.body;

    if (!email || !oldServer || !newServer) {
      return res.status(400).json({
        success: false,
        message: "Email, oldServer, and newServer are required",
      });
    }

    // 🧠 Determine ownership filter
    let filter = { email, server: oldServer };
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

    let filterScraped = { "hostingInfo.email": email, "hostingInfo.server": oldServer };
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
    const { server } = req.params;

    // 🔹 Build filter based on role
    let filter = { server };
    if (req.user.role === "user") {
      filter.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      filter.user = req.user.parentUser;
    }
    // admin → no additional filter needed

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
    console.error("Error in catheServerData:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
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
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Server ID is required" });
    }

    // 🔹 Role-based query
    let query = { _id: id };
    if (req.user.role === "user") {
      query.user = req.user._id;
    } else if (req.user.role === "sub-user") {
      query.user = req.user.parentUser; // sub-user can delete parent's servers
    }
    // admin → can delete any server

    // Find server first
    const serverDoc = await HostingInfo.findOne(query);
    if (!serverDoc) {
      return res.status(404).json({ success: false, message: "Server not found or not authorized" });
    }

    const serverName = serverDoc.server;
    const serverEMail = serverDoc.email;

    // Delete from HostingInfo
    await HostingInfo.deleteOne({ _id: serverDoc._id });

    // Remove only hostingInfo.platform, hostingInfo.server, hostingInfo.email in scraped sites
    const update = {
      $unset: {
        "hostingInfo.platform": "",
        "hostingInfo.server": "",
        "hostingInfo.email": "",
      },
    };

    const updatedResults = await Promise.all([
      ScrapedSite.updateMany({ "hostingInfo.server": serverName, "hostingInfo.email": serverEMail }, update),
      ScrapedGameSite.updateMany({ "hostingInfo.server": serverName, "hostingInfo.email": serverEMail }, update),
      ScrapedDatingSite.updateMany({ "hostingInfo.server": serverName, "hostingInfo.email": serverEMail }, update),
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
    res.status(500).json({ success: false, message: "Failed to delete server", error: err.message });
  }
};

