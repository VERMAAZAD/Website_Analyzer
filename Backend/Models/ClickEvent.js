// models/ClickEvent.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: { type: String, enum: ['click', 'outbound', 'exit'], default: 'click' }, // new field
  // siteId: { type: String, required: true, index: true },
  anonId: { type: String, index: true },
  page: String,
  selector: String,
  tag: String,
  text: String,
  href: String,
  x: Number,
  y: Number,
  elLeft: Number,
  elTop: Number,
  viewportW: Number,
  viewportH: Number,
  ts: { type: Number, index: true },
  duration: Number // optional — time spent before leaving (in ms)
}, { _id: false, timestamps: false });

const ClickBatchSchema = new mongoose.Schema({
  siteId: { type: String, index: true },
  anonId: String,
  page: String,
  ts: Number,
  events: [EventSchema],
  receivedAt: { type: Date, default: Date.now },
  userAgent: String,
  ip: String
}, {
  collection: 'click_batches'
});

// Optional index for analytics speed
ClickBatchSchema.index({ siteId: 1, ts: -1 });
ClickBatchSchema.index({ 'events.type': 1 });
ClickBatchSchema.index({ anonId: 1 });

module.exports = mongoose.model('ClickBatch', ClickBatchSchema);
