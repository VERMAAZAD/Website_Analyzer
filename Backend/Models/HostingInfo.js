const mongoose = require("mongoose");

const hostingInfoSchema = new mongoose.Schema({
  platform: { type: String, default: "" },
  email: { type: String, default: "" },
  server: { type: String, default: "" },
  ServerExpiryDate: { type: Date, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HostingInfo", hostingInfoSchema);
