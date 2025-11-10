const mongoose = require('mongoose');

const ClickEventSchema = new mongoose.Schema({
  linkId: { type: String, index: true },
  chainId: { type: String, default: null }, // optional (same as linkId if multi-hop)
  stepOrder: { type: Number, default: 1 }, // which step in chain
  stepUrl: { type: String, default: null },
  direction: { type: String, enum: ['forward', 'back'], default: 'forward' },

  ts: { type: Date, default: Date.now },
  ipHash: String,
  ua: String,
  referer: String,
  anonId: String,
  country: String,
  decision: String,
  targetUrl: String,
  isBot: { type: Boolean, default: false },

  journeyId: { type: String, default: null }, // groups multiple steps for 1 user
});

module.exports = mongoose.model('ClickEvent', ClickEventSchema);
