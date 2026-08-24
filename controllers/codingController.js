const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const Company = require('../models/Company');
const Bookmark = require('../models/Bookmark');
const { executeCode, runTestCases, isConfigured } = require('../services/executionService');
const rateLimit = require('express-rate-limit');

const codeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many code submissions. Please wait a minute.' },
});

async function listProblems(req, res, next) {
  try {
    const { category = '', difficulty = '', q = '' } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: re }, { tags: { $in: [q] } }];
    }

    const [problems, companies] = await Promise.all([
      CodingProblem.find(filter).sort('difficulty createdAt').lean(),
      Company.find({ isActive: true }).sort('order').lean(),
    ]);

    if (req.user) {
      const solved = await CodeSubmission.find({ user: req.user._id, status: 'accepted' }).distinct('problem');
      const marks = await Bookmark.find({ user: req.user._id, itemType: 'coding_problem' }).distinct('itemId');
      const solvedSet = new Set(solved.map(String));
      const markSet = new Set(marks.map(String));
      problems.forEach((p) => {
        p.solved = solvedSet.has(String(p._id));
        p.bookmarked = markSet.has(String(p._id));
      });
    }

    res.render('coding/problems-list', { title: 'Coding Practice - GET SELECTED', problems, companies, filters: { category, difficulty, q } });
  } catch (err) {
    next(err);
  }
}

async function problemDetail(req, res, next) {
  try {
    const problem = await CodingProblem.findOne({ slug: req.params.slug, isActive: true })
      .populate('companies', 'name slug')
      .lean();
    if (!problem) return res.status(404).render('errors/404', { title: 'Problem not found' });

    const [mySubmissions, bookmark, submissions] = await Promise.all([
      req.user
        ? CodeSubmission.find({ user: req.user._id, problem: problem._id }).sort({ createdAt: -1 }).limit(5).lean()
        : Promise.resolve([]),
      req.user ? Bookmark.findOne({ user: req.user._id, itemType: 'coding_problem', itemId: problem._id }).lean() : Promise.resolve(null),
      CodeSubmission.countDocuments({ problem: problem._id }),
    ]);

    const solutions = {};
    const langKeys = ['python', 'java', 'cpp', 'javascript'];
    for (const lang of langKeys) {
      if (problem.solutions && problem.solutions[lang] && problem.solutions[lang].code) {
        solutions[lang] = problem.solutions[lang];
      } else {
        solutions[lang] = { approach: '', code: '' };
      }
    }
    if (!solutions.python.code && !solutions.java.code && !solutions.cpp.code && !solutions.javascript.code && problem.solution) {
      solutions.javascript = { approach: problem.explanation || '', code: problem.solution };
    }

    const sampleTestCases = problem.testCases?.sample || problem.examples || [];
    const judge0Configured = isConfigured();

    res.render('coding/problem-detail', {
      title: `${problem.title} - GET SELECTED`,
      problem,
      mySubmissions,
      bookmark: !!bookmark,
      submissions,
      solutions,
      sampleTestCases,
      judge0Configured,
    });
  } catch (err) {
    next(err);
  }
}

async function runCode(req, res, next) {
  try {
    if (!isConfigured()) return res.status(503).json({ error: 'Code execution is not configured. Please set JUDGE0_URL.' });

    const problem = await CodingProblem.findOne({ slug: req.params.slug, isActive: true });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    const { language, code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Write some code before running.' });

    const testCases = (problem.testCases?.sample || problem.examples || []).slice(0, 3);
    if (!testCases.length) return res.status(400).json({ error: 'No sample test cases available.' });

    const result = await runTestCases(language, code, testCases, 5);

    res.json({
      status: 'completed',
      total: result.total,
      passed: result.passed,
      failed: result.failed,
      results: result.results.map((r) => ({
        input: r.input,
        expected: r.expected,
        actual: r.actual,
        passed: r.passed,
        status: r.status,
        time: r.time,
        memory: r.memory,
        stderr: r.stderr,
        compile_output: r.compile_output,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function submitCode(req, res, next) {
  try {
    const problem = await CodingProblem.findOne({ slug: req.params.slug, isActive: true });
    if (!problem) return res.status(404).json({ error: 'Problem not found.' });

    const { language, code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Write some code before submitting.' });

    const allTestCases = [...(problem.testCases?.sample || problem.examples || []), ...(problem.testCases?.hidden || [])];

    if (!isConfigured() || !allTestCases.length) {
      await CodeSubmission.create({
        user: req.user._id,
        problem: problem._id,
        language: language || 'javascript',
        code,
        status: 'pending',
        notes: !isConfigured() ? 'Code execution not configured. Submission recorded.' : 'No test cases available. Submission recorded.',
      });
      await CodingProblem.updateOne({ _id: problem._id }, { $inc: { solutionCount: 1 } });
      return res.json({ ok: true, message: 'Submission recorded. Execution not available.', status: 'pending' });
    }

    const result = await runTestCases(language, code, allTestCases, 5);
    const allPassed = result.passed === result.total;

    const submission = await CodeSubmission.create({
      user: req.user._id,
      problem: problem._id,
      language: language || 'javascript',
      code,
      status: allPassed ? 'accepted' : 'wrong_answer',
      output: result.results.map((r) => r.actual).join('\n---\n'),
      expected: result.results.map((r) => r.expected).join('\n---\n'),
      passedCases: result.passed,
      totalCases: result.total,
      runtime: Math.max(...result.results.map((r) => r.time || 0)),
      memory: Math.max(...result.results.map((r) => r.memory || 0)),
    });

    await CodingProblem.updateOne({ _id: problem._id }, { $inc: { solutionCount: 1 } });

    res.json({
      ok: true,
      status: submission.status,
      passed: result.passed,
      failed: result.failed,
      total: result.total,
      runtime: submission.runtime,
      memory: submission.memory,
      results: result.results.map((r) => ({
        input: r.input,
        expected: r.expected,
        actual: r.actual,
        passed: r.passed,
        status: r.status,
        time: r.time,
        stderr: r.stderr,
        compile_output: r.compile_output,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function myAttempts(req, res, next) {
  try {
    const submissions = await CodeSubmission.find({ user: req.user._id })
      .populate('problem', 'title slug difficulty category')
      .sort({ createdAt: -1 })
      .lean();
    res.render('coding/my-attempts', { title: 'My Coding Submissions - GET SELECTED', submissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProblems, problemDetail, runCode, submitCode, myAttempts, codeLimiter };
