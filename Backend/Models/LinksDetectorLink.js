// models/Link.js
const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  linkId: { type: String, index: true, unique: true },
  owner: { type: String, default: null }, // optional owner/user
  target: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  preflight: {
    redirects: [{ from: String, status: Number, to: String }],
    finalUrl: String,
    hopCount: Number,
    finalDomain: String
  },
  options: {
    requireJsToken: { type: Boolean, default: false } // optional future feature
  }
});

module.exports = mongoose.model('Link', LinkSchema);
