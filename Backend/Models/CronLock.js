const mongoose = require("mongoose");

const CronLockSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  lockedAt: { type: Date, required: true },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
});


module.exports = mongoose.model("CronLock", CronLockSchema);