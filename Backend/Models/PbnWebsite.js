const mongoose = require("mongoose");

const PbnWebsiteSchema = new mongoose.Schema({
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
  
  PbnWebsiteSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
  
  PbnWebsiteSchema.index({ userId: 1, siteId: 1 });
  PbnWebsiteSchema.index({ domain: 1 });

module.exports = mongoose.model("PbnWebsite", PbnWebsiteSchema);
