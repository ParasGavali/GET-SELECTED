const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const QuestionAttempt = require('../models/QuestionAttempt');
const Bookmark = require('../models/Bookmark');

async function practiceSetup(req, res, next) {
  try {
    const [subjects, topics] = await Promise.all([
      Subject.find({ isActive: true }).sort('order').lean(),
      Topic.find({ isActive: true }).populate('subject', 'name slug').sort('order').lean(),
    ]);

    const selectedSubject = req.query.subject || '';
    const selectedTopic = req.query.topic || '';
    const selectedDifficulty = req.query.difficulty || '';

    res.render('student/practice-setup', {
      title: 'Practice - GET SELECTED',
      subjects,
      topics,
      selectedSubject,
      selectedTopic,
      selectedDifficulty,
      totalQuestions: await Question.countDocuments({ isActive: true }),
    });
  } catch (err) {
    next(err);
  }
}

/** Build a practice session: GET questions matching filters, render the session page. */
async function startSession(req, res, next) {
  try {
    const { subject, topic, difficulty, count } = req.query;
    const filter = { isActive: true };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    // Weak topic questions only
    if (req.query.weak === '1' && req.user) {
      const attempts = await QuestionAttempt.aggregate([
        { $match: { user: req.user._id, correct: false } },
        { $group: { _id: '$topic', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]);
      const topicIds = attempts.map((a) => a._id);
      if (topicIds.length) filter.topic = { $in: topicIds };
    }

    // Unattempted only
    if (req.query.unattempted === '1' && req.user) {
      const attempted = await QuestionAttempt.find({ user: req.user._id }).distinct('question');
      if (attempted.length) filter._id = { $nin: attempted };
    }

    // Bookmarked only
    if (req.query.bookmarked === '1' && req.user) {
      const marks = await Bookmark.find({ user: req.user._id, itemType: 'question' }).distinct('itemId');
      if (!marks.length) return res.redirect('/practice?msg=none');
      filter._id = { $in: marks };
    }

    let num = parseInt(count, 10) || 10;
    num = Math.min(Math.max(num, 5), 50);

    let questions = await Question.find(filter).populate('topic', 'name slug').populate('subject', 'name slug color').sort('topic order').lean();

    // Randomize
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    questions = questions.slice(0, num);

    if (!questions.length) {
      req.flash('info', 'No questions match those filters. Try adjusting them.');
      return res.redirect('/practice');
    }

    const marks = req.user
      ? await Bookmark.find({ user: req.user._id, itemType: 'question', itemId: { $in: questions.map((q) => q._id) } }).distinct('itemId')
      : [];

    res.render('student/practice-session', {
      title: 'Practice Session - GET SELECTED',
      questions,
      bookmarkIds: marks.map(String),
    });
  } catch (err) {
    next(err);
  }
}

/** Grade practice answers, save attempts, return JSON review data. */
async function submitPractice(req, res, next) {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ error: 'No answers submitted.' });

    const ids = answers.map((a) => a.question);
    const questions = await Question.find({ _id: { $in: ids } }).populate('topic', 'name slug').lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));

    const review = [];
    const qaDocs = [];

    for (const a of answers) {
      const q = qMap.get(String(a.question));
      if (!q) continue;
      const selected = a.selected;
      const isCorrect = selected !== null && selected === q.correctOption;
      review.push({
        question: {
          _id: q._id,
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          type: q.type,
        },
        selected,
        isCorrect,
      });
      if (selected !== null) {
        qaDocs.push({
          user: req.user ? req.user._id : null,
          question: q._id,
          subject: q.subject,
          topic: q.topic ? q.topic._id : null,
          mode: 'practice',
          correct: isCorrect,
          timeSpent: Math.min(a.timeSpent || 0, 300),
        });
      }
    }

    if (qaDocs.length && req.user) await QuestionAttempt.insertMany(qaDocs);

    const correctCount = review.filter((r) => r.isCorrect).length;
    const result = {
      total: review.length,
      correct: correctCount,
      incorrect: review.filter((r) => r.selected !== null && !r.isCorrect).length,
      skipped: review.filter((r) => r.selected === null).length,
      accuracy: review.length ? Math.round((correctCount / review.length) * 100) : 0,
      review,
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { practiceSetup, startSession, submitPractice };
