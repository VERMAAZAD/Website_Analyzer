const mongoose = require("mongoose");

const hostingInfoSchema = new mongoose.Schema({
  platform: { type: String, default: "" },
  email: { type: String, default: "" },
  server: { type: String, default: "" },
  domainPlatform: { type: String, default: "" },
  domainEmail: { type: String, default: "" },
  cloudflare: { type: String, default: "" },
  hostingIssueDate: { type: Date, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HostingInfo", hostingInfoSchema);
