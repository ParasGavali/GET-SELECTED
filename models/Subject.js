const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true }, // APT, LOGICAL, VERBAL, TECHNICAL, CODING, SQL
    description: { type: String, default: '' },
    icon: { type: String, default: 'book-open' }, // lucide icon name
    color: { type: String, default: '#4f46e5' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.virtual('questionCount', { ref: 'Question', localField: '_id', foreignField: 'subject', count: true });

subjectSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Subject', subjectSchema);
