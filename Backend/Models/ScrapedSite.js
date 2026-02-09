const mongoose = require('mongoose');

const ScrapedSiteSchema = new mongoose.Schema({
  domain: {
  type: String,
  required: true,
  unique: true, 
},
  h1: [String],
  h2: [String],
  images: [String],
  canonicals: [String],
  title: String,
  description: String,
  altTags: [String],
  wordCount: Number,
  robotsTxt: String,
  schemaPresent: Boolean,
  statusCode: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  brandCategory: { type: String },
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  affiliateLink: { type: String, default: null },
  categoryAffiliateLink: {
    type: String,
    default: "",
    index: true,
  },
  affiliateCheckRunning: {
    type: Boolean,
    default: false
  },
  affiliateCheckReason: {
    type: String,
    default: null
  },
  affiliateCheckStatus: {
    type: String,
    enum: ["ok", "warning", "error", "checking"],
    default: "checking"
  },
  lastAffiliateCheck: { type: Date },
  issueDate: { type: Date, default: null },
  note: { type: String, default: '' },
  isIndexedOnBing: { type: Boolean, default: false },
  lastBingCheck: { type: Date },
  hostingInfo: {
    platform: { type: String, default: "" },
    email: { type: String, default: "" },
    server: { type: String, default: "" },
    domainPlatform: { type: String, default: "" },
    domainEmail: { type: String, default: "" },
    cloudflare: { type: String, default: "" },
    status: { type: String, default: "active" },
},
 manualError: {
    type: Boolean,
    default: false,
    index: true,
  },

  manualErrorCategory: {
    type: String,
    default: null, // e.g. "Suspended", "Expired", "Parked"
    index: true,
  },
  manualErrorAddedAt: {
    type: Date,
    default: null,
  },
  ignoredByUser: {
  type: Boolean,
  default: false,
},
});

module.exports = mongoose.model('ScrapedSite', ScrapedSiteSchema);
