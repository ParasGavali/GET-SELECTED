const CodingProblem = require('../models/CodingProblem');
const CodeSubmission = require('../models/CodeSubmission');
const Company = require('../models/Company');
const Bookmark = require('../models/Bookmark');

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
      const solved = await CodeSubmission.find({ user: req.user._id }).distinct('problem');
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
    const problem = await CodingProblem.findOne({ slug: req.params.slug, isActive: true }).populate('companies', 'name slug').lean();
    if (!problem) return res.status(404).render('errors/404', { title: 'Problem not found' });

    const [mySubmissions, bookmark, submissions] = await Promise.all([
      req.user ? CodeSubmission.find({ user: req.user._id, problem: problem._id }).sort({ createdAt: -1 }).limit(5).lean() : Promise.resolve([]),
      req.user ? Bookmark.findOne({ user: req.user._id, itemType: 'coding_problem', itemId: problem._id }).lean() : Promise.resolve(null),
      CodeSubmission.countDocuments({ problem: problem._id }),
    ]);

    res.render('coding/problem-detail', {
      title: `${problem.title} - GET SELECTED`,
      problem,
      mySubmissions,
      bookmark: !!bookmark,
      submissions,
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

    await CodeSubmission.create({ user: req.user._id, problem: problem._id, language: language || 'javascript', code });
    await CodingProblem.updateOne({ _id: problem._id }, { $inc: { solutionCount: 1 } });
    res.json({ ok: true, message: 'Submission recorded. Code execution is not yet available in Phase 1.' });
  } catch (err) {
    next(err);
  }
}

async function myAttempts(req, res, next) {
  try {
    const submissions = await CodeSubmission.find({ user: req.user._id }).populate('problem', 'title slug difficulty category').sort({ createdAt: -1 }).lean();
    res.render('coding/my-attempts', { title: 'My Coding Submissions - GET SELECTED', submissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProblems, problemDetail, submitCode, myAttempts };
