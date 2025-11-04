// models/ClickEvent.js
const mongoose = require('mongoose');

const ClickEventSchema = new mongoose.Schema({
  linkId: { type: String, index: true },
  ts: { type: Date, default: Date.now },
  ipHash: String,
  ua: String,
  referer: String,
  anonId: String,
  country: String,
  decision: String, // 'redirect' | 'block'
  targetUrl: String,
  isBot: { type: Boolean, default: false }
});

module.exports = mongoose.model('ClickEvent', ClickEventSchema);
