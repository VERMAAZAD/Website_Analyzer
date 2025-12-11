const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  slug: String,
  rootSlug: String,
  sessionId: String,
  step: Number,
  ip: String,
  country: String,
  device: String,
  browser: String,
  os: String,
  timestamp: { type: Date, default: Date.now }
});

analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("CreateLinkAnalytics", analyticsSchema);
