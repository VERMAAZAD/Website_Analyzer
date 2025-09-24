const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,  
      trim: true,  
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    },
   landingPageUrl: {
  type: String,
  required: true,
  match: [
    /^(https?:\/\/)([a-zA-Z0-9.-]+|\blocalhost)(:\d+)?(\/.*)?$/,
    'Please enter a valid URL'
  ],
},
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

// Create the model
const webEmailData = mongoose.model('webEmailData', emailSchema);

module.exports = webEmailData;
