const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    section: { type: String, default: '' },
    selected: { type: Number, default: null },
    isMarked: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // seconds
    isCorrect: { type: Boolean, default: false },
    correctOption: { type: Number, default: null },
  },
  { _id: false }
);

const sectionStatSchema = new mongoose.Schema(
  {
    section: { type: String, required: true },
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false }
);

const topicStatSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    subject: { type: String, default: '' },
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    status: { type: String, enum: ['in_progress', 'submitted', 'auto_submitted', 'timed_out'], default: 'in_progress', index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: 10 },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // seconds actually spent
    sectionStats: { type: [sectionStatSchema], default: [] },
    topicStats: { type: [topicStatSchema], default: [] },
    percentile: { type: Number, default: null },
    rank: { type: Number, default: null },
  },
  { timestamps: true }
);

attemptSchema.index({ test: 1, status: 1, score: -1 });
attemptSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('TestAttempt', attemptSchema);
