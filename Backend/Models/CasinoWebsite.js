const mongoose = require("mongoose");

const CasinoWebsiteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  siteId: { type: String, required: true },   
  domain: String,
  path: String,
  visitorId: String,                          
  ip: String,
  userAgent: String,
  location: Object,
  timestamp: { type: Date, default: Date.now },
});

CasinoWebsiteSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

CasinoWebsiteSchema.index({ userId: 1, siteId: 1 });
CasinoWebsiteSchema.index({ domain: 1 });

module.exports = mongoose.model("CasinoWebsite", CasinoWebsiteSchema);
