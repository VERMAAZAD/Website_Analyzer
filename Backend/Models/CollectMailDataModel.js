const mongoose = require('mongoose');

const maildataSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    landingPageUrl: { type: String },
    ip: { type: String },
    geo: {
      country: { type: String },
      region: { type: String },
      city: { type: String },
      lat: { type: Number },
      lon: { type: Number },
      timezone: { type: String }
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model("CollectEmailData", maildataSchema);

