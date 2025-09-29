// ClickEvent.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  siteId: { type: String, index: true },
  anonId: String,
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
  ts: Number
}, { _id: false });

const ClickSchema = new mongoose.Schema({
  siteId: { type: String, index: true },
  anonId: String,
  page: String,
  ts: Number,
  events: [EventSchema],
  receivedAt: { type: Date, default: Date.now },
  userAgent: String,
  ip: String
});

module.exports = mongoose.model('ClickBatch', ClickSchema);
