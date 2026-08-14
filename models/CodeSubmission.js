const mongoose = require('mongoose');

const codeSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true, index: true },
    language: { type: String, enum: ['javascript', 'python', 'java', 'c', 'cpp'], default: 'javascript' },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['submitted', 'pending', 'manual_review'],
      default: 'submitted',
      index: true,
    },
    notes: { type: String, default: 'Code execution is not yet available. This submission is recorded for review and practice tracking.' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

codeSubmissionSchema.index({ user: 1, createdAt: -1 });
codeSubmissionSchema.index({ problem: 1, status: 1 });

module.exports = mongoose.model('CodeSubmission', codeSubmissionSchema);
