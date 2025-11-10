const mongoose = require('mongoose');

const LinksDomainSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  baseUrl: { type: String, required: true },           
  owner: { type: String, default: null },               
  verified: { type: Boolean, default: true },          
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LinksDomain', LinksDomainSchema);
