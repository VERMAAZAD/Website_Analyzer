const mongoose = require("mongoose");

const trafficSchema = new mongoose.Schema({
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

trafficSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

trafficSchema.index({ userId: 1, siteId: 1 });
trafficSchema.index({ domain: 1 });

module.exports = mongoose.model("Trafficchecker", trafficSchema);
