const Bookmark = require('../models/Bookmark');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const Test = require('../models/Test');

async function toggleBookmark(req, res) {
  try {
    const { itemType, itemId } = req.body;
    if (!['question', 'coding_problem', 'test'].includes(itemType) || !itemId) {
      return res.status(400).json({ error: 'Invalid bookmark request.' });
    }
    const existing = await Bookmark.findOne({ user: req.user._id, itemType, itemId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }
    await Bookmark.create({ user: req.user._id, itemType, itemId });
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function savedPage(req, res, next) {
  try {
    const [questionMarks, codingMarks, testMarks] = await Promise.all([
      Bookmark.find({ user: req.user._id, itemType: 'question' }).sort({ createdAt: -1 }).lean(),
      Bookmark.find({ user: req.user._id, itemType: 'coding_problem' }).sort({ createdAt: -1 }).lean(),
      Bookmark.find({ user: req.user._id, itemType: 'test' }).sort({ createdAt: -1 }).lean(),
    ]);

    const [questions, coding, tests] = await Promise.all([
      Question.find({ _id: { $in: questionMarks.map((m) => m.itemId) } }).populate('topic', 'name slug').populate('subject', 'name slug').lean(),
      CodingProblem.find({ _id: { $in: codingMarks.map((m) => m.itemId) } }).lean(),
      Test.find({ _id: { $in: testMarks.map((m) => m.itemId) } }).populate('company', 'name slug').lean(),
    ]);

    res.render('student/saved', { title: 'Saved - GET SELECTED', questions, coding, tests });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleBookmark, savedPage };
