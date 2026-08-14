const mongoose = require('mongoose');

const questionAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null, index: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    mode: { type: String, enum: ['practice', 'test', 'daily'], default: 'practice' },
    correct: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

questionAttemptSchema.index({ user: 1, createdAt: -1 });
questionAttemptSchema.index({ user: 1, subject: 1, topic: 1 });

module.exports = mongoose.model('QuestionAttempt', questionAttemptSchema);
