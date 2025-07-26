const mongoose = require('mongoose');

const ScrapedSiteSchema = new mongoose.Schema({
   domain: String,
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
  isIndexedOnBing: {
    type: Boolean,
    default: true,
  },
  lastBingCheck: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('ScrapedSite', ScrapedSiteSchema);
