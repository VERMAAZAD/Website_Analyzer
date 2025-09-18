const mongoose = require('mongoose');
const { nanoid } = require('nanoid'); // for short unique IDs

const ReferenceSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
    },
    affiliate: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      default: () => nanoid(8), // generates something like 'a1b2C3d4'
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('CreateReference', ReferenceSchema);
