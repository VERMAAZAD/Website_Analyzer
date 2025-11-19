// Models/UserVisit.js
const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
  uid: { type: String, index: true }, // cross-domain user id
  domain: String,
  path: String,
  url: String,
  referrer: String,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  country: String,
  browser: String,
  os: String,
  device: String,
  params: Object // utm or extra params
});

module.exports = mongoose.model('Visit', VisitSchema);
