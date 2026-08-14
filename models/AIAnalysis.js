const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
    subjectSlug: { type: String, default: '' },
    topicSlug: { type: String, default: '' },
    action: { type: String, enum: ['practice', 'test', 'learn'], default: 'practice' },
    reason: { type: String, default: '' },
    link: { type: String, default: '' },
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, enum: ['overall', 'weekly', 'monthly'], default: 'overall' },
    summary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [recommendationSchema], default: [] },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    isFallback: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ user: 1, period: 1, createdAt: -1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
