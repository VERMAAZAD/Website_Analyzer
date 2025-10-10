const mongoose = require('mongoose');

const maildataSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: {type: String },
    age: { type: Number },
    category: { type: String },
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

maildataSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("CollectEmailData", maildataSchema);

