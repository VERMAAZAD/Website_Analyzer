const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  linkId: { type: String, index: true, unique: true },
  owner: { type: String, default: null }, // optional user ID or email
  baseDomain: { type: String, required: false },
  target: { type: String, required: true }, // main destination if not using chain
  chain: [
    {
      order: Number, // sequence in chain
      url: String,   // URL to redirect to
      domain: String // extracted domain (for analytics)
    }
  ],
  isChain: { type: Boolean, default: false }, // whether this link is multi-hop
  createdAt: { type: Date, default: Date.now },

  preflight: {
    redirects: [{ from: String, status: Number, to: String }],
    finalUrl: String,
    hopCount: Number,
    finalDomain: String
  },

  stats: {
    totalClicks: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    last24hClicks: { type: Number, default: 0 },
    botClicks: { type: Number, default: 0 },
  },

  options: {
    requireJsToken: { type: Boolean, default: false }, // optional anti-bot feature
    returnUrl: { type: String, default: null }, // where user comes back to
  },
});

module.exports = mongoose.model('Link', LinkSchema);
