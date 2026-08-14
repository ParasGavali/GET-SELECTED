const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    marksPerQuestion: { type: Number, default: 1, min: 0.5 },
    negativePerQuestion: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['quick_quiz', 'topic', 'sectional', 'mock', 'company_mock', 'contest', 'daily'],
      default: 'quick_quiz',
      index: true,
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    durationMinutes: { type: Number, default: 10, min: 1, max: 300 },
    sections: { type: [sectionSchema], default: [] },
    negativeMarking: { type: Boolean, default: false },
    randomization: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
    isPublished: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },
    instructions: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    attemptsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testSchema.index({ type: 1, isPublished: 1 });
testSchema.index({ company: 1, type: 1 });

module.exports = mongoose.model('Test', testSchema);
