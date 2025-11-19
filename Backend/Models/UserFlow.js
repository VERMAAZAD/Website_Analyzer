// Models/UserFlow.js
const mongoose = require('mongoose');

const FlowSchema = new mongoose.Schema({
  uid: { type: String, index: true },
  steps: [
    {
      domain: String,
      path: String,
      url: String,
      timestamp: Date
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserFlow', FlowSchema);
