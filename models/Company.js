const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortName: { type: String, default: '' },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    color: { type: String, default: '#334155' },
    tags: { type: [String], default: [] },
    focusAreas: { type: [String], default: [] }, // e.g. ['Aptitude', 'Reasoning', 'Verbal', 'Coding']
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    disclaimer: {
      type: String,
      default: 'Company preparation content on GET SELECTED is created for practice only and is not affiliated with or endorsed by the company. It does not represent actual past or current selection processes.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
