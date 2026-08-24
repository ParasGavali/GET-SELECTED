const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: [true, 'Question text is required'], trim: true },
    type: { type: String, enum: ['mcq', 'sql'], default: 'mcq', index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    subtopic: { type: String, default: '', trim: true },
    options: {
      type: [String],
      validate: {
        validator: function (v) {
          if (this.type === 'mcq' || this.type === 'sql') return v && v.length === 4 && v.every((o) => o.trim().length > 0);
          return true;
        },
        message: 'MCQ questions must have exactly 4 non-empty options',
      },
    },
    correctOption: {
      type: Number,
      min: 0,
      max: 3,
      validate: {
        validator: function (v) {
          if (this.type === 'mcq' || this.type === 'sql') return typeof v === 'number' && v >= 0 && v <= 3;
          return true;
        },
        message: 'A correct option index is required for MCQ questions',
      },
    },
    explanation: { type: String, default: '', trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    estimatedTime: { type: Number, default: 60, min: 5, max: 3600 }, // seconds
    tags: { type: [String], default: [] },
    companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: [] }],
    positionTags: {
      type: [String],
      enum: [
        'Software Engineer',
        'Backend Developer',
        'Frontend Developer',
        'Full Stack Developer',
        'Data Analyst',
        'Data Scientist',
        'AI/ML Engineer',
        'QA/Test Engineer',
      ],
      default: [],
    },
    source: { type: String, default: 'get-selected' },
    sourceName: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, topic: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ text: 'text', subtopic: 'text', tags: 'text' });

module.exports = mongoose.model('Question', questionSchema);
