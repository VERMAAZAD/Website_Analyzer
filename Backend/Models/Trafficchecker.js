const mongoose = require("mongoose");

const trafficSchema = new mongoose.Schema({
 userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          index: true,
        },
    
        siteId: {
          type: String,
          required: true,
          index: true,
        },
    
        domain: {
          type: String,
        },
    
        path: {
          type: String,
          index: true,
        },
    
        visitorId: {
          type: String,
          index: true,
        },
    
        ip: {
          type: String,
          index: true,
        },
    
        userAgent: {
          type: String,
        },
    
        location: {
          country: String,
          region: String,
          city: String,
          ll: [Number],
        },
    
        isProxyLikely: {
          type: Boolean,
          default: false,
          index: true,
        },
    
        timestamp: {
          type: Date,
          default: Date.now,
        },

        domainNote: {
          type: String,
          default: null,
        },

        isNoteOnly: {
          type: Boolean,
          default: false,
        },
});

trafficSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

trafficSchema.index({ userId: 1, siteId: 1 });
trafficSchema.index({ domain: 1 });
trafficSchema.index({ userId: 1, domain: 1, domainNote: 1 });


module.exports = mongoose.model("Trafficchecker", trafficSchema);
