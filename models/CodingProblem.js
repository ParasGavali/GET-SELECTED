const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const solutionEntrySchema = new mongoose.Schema(
  {
    approach: { type: String, default: '' },
    code: { type: String, default: '' },
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: ['programming', 'dsa', 'sql'], default: 'dsa', index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    problemStatement: { type: String, required: true },
    examples: { type: [exampleSchema], default: [] },
    constraints: { type: String, default: '' },
    tags: { type: [String], default: [] },
    concepts: { type: [String], default: [] },
    explanation: { type: String, default: '' },
    solution: { type: String, default: '' },
    solutions: {
      type: {
        python: { type: solutionEntrySchema, default: () => ({}) },
        java: { type: solutionEntrySchema, default: () => ({}) },
        cpp: { type: solutionEntrySchema, default: () => ({}) },
        javascript: { type: solutionEntrySchema, default: () => ({}) },
      },
      default: () => ({}),
    },
    testCases: {
      type: {
        sample: { type: [testCaseSchema], default: () => [] },
        hidden: { type: [testCaseSchema], default: () => [] },
      },
      default: () => ({ sample: [], hidden: [] }),
    },
    timeLimit: { type: Number, default: 2 },
    companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: [] }],
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    solutionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

codingProblemSchema.index({ category: 1, difficulty: 1, isActive: 1 });
codingProblemSchema.index({ title: 'text', tags: 'text' });

codingProblemSchema.methods.getSolutionForLanguage = function (lang) {
  if (this.solutions && this.solutions[lang] && this.solutions[lang].code) {
    return this.solutions[lang];
  }
  return { approach: '', code: this.solution || '' };
};

module.exports = mongoose.model('CodingProblem', codingProblemSchema);
