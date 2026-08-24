const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    officialName: { type: String, required: [true, 'College name is required'], unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortName: { type: String, default: '', trim: true },
    aliases: { type: [String], default: [] },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: 'Maharashtra', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

collegeSchema.index({ officialName: 'text', shortName: 'text', aliases: 'text' });

module.exports = mongoose.model('College', collegeSchema);
