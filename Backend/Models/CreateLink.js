const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  shortUrl: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  folderName: { type: String, default: null },
  chainNextSlug: { type: String, default: null }, 
  chainNote: { type: String, default: null },
  chainGroupId: { type: String, default: null },  // 🔥 NEW FIELD
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CreateLink", linkSchema);
