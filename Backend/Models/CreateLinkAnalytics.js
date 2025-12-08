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

module.exports = mongoose.model("CreateLinkAnalytics", analyticsSchema);
