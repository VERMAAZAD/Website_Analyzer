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

  categoryAffiliateLinks: {
    primary: {
      url: { type: String, default: "" },
      status: {
        type: String,
        enum: ["ok", "warning", "error", "checking"],
        default: "error"
      },
      reason: { type: String, default: null },
      finalUrl: { type: String, default: "" },
      
      // ✅ NEW: Track full redirect chain
      redirectChain: [{ type: String }],  // Array of all URLs in redirect chain
      
      // ✅ NEW: Performance metrics
      responseTime: { type: Number, default: 0 },  // milliseconds
      httpStatus: { type: Number, default: null },
      
      // ✅ NEW: Redirect mismatch flag
      redirectMismatch: { type: Boolean, default: false },
      
      lastChecked: { type: Date },
    },

    secondary: {
      url: { type: String, default: "" },
      status: {
        type: String,
        enum: ["ok", "warning", "error", "checking"],
        default: "error"
      },
      reason: { type: String, default: null },
      finalUrl: { type: String, default: "" },
      
      // ✅ NEW: Track full redirect chain
      redirectChain: [{ type: String }],  // Array of all URLs in redirect chain
      
      // ✅ NEW: Performance metrics
      responseTime: { type: Number, default: 0 },  // milliseconds
      httpStatus: { type: Number, default: null },
      
      lastChecked: { type: Date }
    }
  },
  affiliateAlertSent: {
    type: Boolean,
    default: false,
    index: true,
  },
  affiliateAlertSentAt: {
    type: Date,
    default: null,
  },
  lastAffiliateCheck: { type: Date },
  issueDate: { type: Date, default: null },
  note: { type: String, default: '' },
  
  isIndexedOnBing: { 
    type: Boolean, 
    default: false,
    index: true,  // Index for faster queries
  },
  lastBingCheck: { 
    type: Date,
    index: true,  // Index for date-based filtering
  },
  bingFirstResult: { 
    type: String,
    default: null 
  },
  bingResultCount: { 
    type: Number,
    default: 0 
  },

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

ScrapedSiteSchema.index({ user: 1, isIndexedOnBing: 1 });
ScrapedSiteSchema.index({ lastBingCheck: 1 });
ScrapedSiteSchema.index({ user: 1, lastBingCheck: 1 });

module.exports = mongoose.model('ScrapedSite', ScrapedSiteSchema);
