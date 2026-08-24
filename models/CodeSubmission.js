const mongoose = require('mongoose');

const codeSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true, index: true },
    language: { type: String, enum: ['javascript', 'python', 'java', 'c', 'cpp'], default: 'javascript' },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['submitted', 'pending', 'accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'tle', 'manual_review'],
      default: 'submitted',
      index: true,
    },
    output: { type: String, default: '' },
    expected: { type: String, default: '' },
    passedCases: { type: Number, default: 0 },
    totalCases: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

codeSubmissionSchema.index({ user: 1, createdAt: -1 });
codeSubmissionSchema.index({ problem: 1, status: 1 });

module.exports = mongoose.model('CodeSubmission', codeSubmissionSchema);
