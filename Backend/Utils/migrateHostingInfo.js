require("dotenv").config({ path: "../.env" }); // go one level up to load .env
const mongoose = require("mongoose");

// Import models from ../Models
const ScrapedSite = require("../Models/ScrapedSite");
const ScrapedGameSite = require("../Models/ScrapedGameSite");
const ScrapedDatingSite = require("../Models/ScrapedDatingSite");
const HostingInfo = require("../Models/HostingInfo");

async function migrateHostingInfo() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    // Connect using your MONGO_CONN from .env
    await mongoose.connect(process.env.MONGO_CONN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    const collections = [ScrapedSite, ScrapedGameSite, ScrapedDatingSite];
    const seen = new Set(); // track unique email+server
    let insertedCount = 0;

    for (const Model of collections) {
      const docs = await Model.find({});

      for (const doc of docs) {
        if (doc.hostingInfo) {
          const info = doc.hostingInfo;
          const email = info.email || "";
          const server = info.server || "";

          // uniqueness = email+server
          const key = `${email}|${server}`;

          if (!seen.has(key)) {
            seen.add(key);

            // check if exists already
            const exists = await HostingInfo.findOne({ email, server });

            if (!exists) {
              await HostingInfo.create({
                platform: info.platform || "",
                email,
                server,
                domainPlatform: info.domainPlatform || "",
                domainEmail: info.domainEmail || "",
                cloudflare: info.cloudflare || "",
                hostingIssueDate: info.hostingIssueDate || null,
                user: doc.user,
              });
              insertedCount++;
            }
          }
        }
      }
    }

    console.log(`🎉 Migration finished. Inserted ${insertedCount} unique hosting records.`);
    process.exit();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateHostingInfo();
