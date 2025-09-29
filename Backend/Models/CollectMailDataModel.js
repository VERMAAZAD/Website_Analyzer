const mongoose = require('mongoose');

const maildataSchema = new mongoose.Schema({
  name: {type: String},
  email: {type: String},
  landingPageUrl: {type: String},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CollectEmailData", maildataSchema);
