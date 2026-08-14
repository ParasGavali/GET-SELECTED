const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    title: { type: String, required: true },
    description: { type: String, default: '' },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    codingProblem: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
