const mongoose = require("mongoose");

const PbnWebsiteSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    siteId: {
      type: String,
      required: true,
      index: true,
    },

    domain: {
      type: String,
      index: true,
    },

    path: {
      type: String,
      index: true,
    },

    visitorId: {
      type: String,
      index: true,
    },

    ip: {
      type: String,
      index: true,
    },

    userAgent: {
      type: String,
    },

    location: {
      country: String,
      region: String,
      city: String,
      ll: [Number],
    },

    isProxyLikely: {
      type: Boolean,
      default: false,
      index: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  });
  
  PbnWebsiteSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
  
  PbnWebsiteSchema.index({ userId: 1, siteId: 1 });
  PbnWebsiteSchema.index({ domain: 1 });

module.exports = mongoose.model("PbnWebsite", PbnWebsiteSchema);
