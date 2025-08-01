const mongoose = require('mongoose');

const ScrapedDatingSchema = new mongoose.Schema({
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
  issueDate: { type: Date, default: null },
  note: { type: String, default: '' },
  isIndexedOnBing: { type: Boolean, default: false },
  isIndexedOnGoogle: { type: Boolean, default: false },
  lastBingCheck: { type: Date },
  lastGoogleCheck: { type: Date },
  hostingInfo: {
  platform: { type: String, default: "" },
  email: { type: String, default: "" },
  server: { type: String, default: "" },
  domainPlatform: { type: String, default: "" },
  domainEmail: { type: String, default: "" },
  cloudflare: { type: String, default: "" },
},
});

module.exports = mongoose.model('ScrapedDatingSite', ScrapedDatingSchema);
