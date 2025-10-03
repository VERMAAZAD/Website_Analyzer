const mongoose = require("mongoose");

const trafficSchema = new mongoose.Schema({
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


module.exports = mongoose.model("Trafficchecker", trafficSchema);
