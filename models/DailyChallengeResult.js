const mongoose = require('mongoose');

const dailyChallengeResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyChallenge', required: true, index: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selected: { type: Number, default: null },
        isCorrect: { type: Boolean, default: false },
      },
      { _id: false },
    ],
    score: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    codingSolved: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

dailyChallengeResultSchema.index({ user: 1, challenge: 1 }, { unique: true });

module.exports = mongoose.model('DailyChallengeResult', dailyChallengeResultSchema);
