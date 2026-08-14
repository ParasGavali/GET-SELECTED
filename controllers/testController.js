const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Subject = require('../models/Subject');
const Company = require('../models/Company');
const Question = require('../models/Question');
const Bookmark = require('../models/Bookmark');
const { buildTestQuestions, gradeTest } = require('../services/testService');
const { computeAttemptRanking } = require('../services/rankingService');

const TEST_TYPE_LABELS = {
  quick_quiz: 'Quick Quiz',
  topic: 'Topic Test',
  sectional: 'Sectional Test',
  mock: 'Full Mock',
  company_mock: 'Company Mock',
  contest: 'Contest',
  daily: 'Daily Challenge',
};

async function listTests(req, res, next) {
  try {
    const { type = '', subject = '', company = '' } = req.query;
    const filter = { isPublished: true };
    if (type) filter.type = type;
    if (subject) filter.subject = subject;
    if (company) filter.company = company;

    const [tests, subjects, companies, types] = await Promise.all([
      Test.find(filter).populate('company', 'name slug color').populate('subject', 'name slug').sort('-createdAt').lean(),
      Subject.find({ isActive: true }).sort('order').lean(),
      Company.find({ isActive: true }).sort('order').lean(),
      Object.entries(TEST_TYPE_LABELS),
    ]);

    // Add attempt counts + question counts
    for (const t of tests) {
      t.questionCount = t.sections.reduce((s, sec) => s + (sec.questions ? sec.questions.length : 0), 0);
      if (req.user) {
        t.myBest = await TestAttempt.findOne({ user: req.user._id, test: t._id, status: { $in: ['submitted', 'auto_submitted'] } })
          .sort({ score: -1 })
          .select('score maxScore percentile')
          .lean();
      }
    }

    res.render('student/tests-list', {
      title: 'Tests - GET SELECTED',
      tests,
      subjects,
      companies,
      types,
      filters: { type, subject, company },
    });
  } catch (err) {
    next(err);
  }
}

async function testDetail(req, res, next) {
  try {
    const test = await Test.findOne({ slug: req.params.slug, isPublished: true })
      .populate('company', 'name slug color')
      .populate('subject', 'name slug')
      .populate('sections.questions', 'text difficulty topic')
      .lean();
    if (!test) return res.status(404).render('errors/404', { title: 'Test not found' });

    const [attemptCount, recentAttempts] = await Promise.all([
      TestAttempt.countDocuments({ test: test._id, status: { $in: ['submitted', 'auto_submitted'] } }),
      req.user
        ? TestAttempt.find({ user: req.user._id, test: test._id, status: { $in: ['submitted', 'auto_submitted'] } })
            .sort({ submittedAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
    ]);

    const totalQuestions = test.sections.reduce((s, sec) => s + sec.questions.length, 0);

    res.render('student/test-detail', {
      title: `${test.title} - GET SELECTED`,
      test,
      attemptCount,
      recentAttempts,
      totalQuestions,
      labels: TEST_TYPE_LABELS,
    });
  } catch (err) {
    next(err);
  }
}

async function startTest(req, res, next) {
  try {
    const test = await Test.findOne({ _id: req.params.id, isPublished: true }).lean();
    if (!test) return res.status(404).render('errors/404', { title: 'Test not found' });

    if (test.maxAttempts > 0) {
      const done = await TestAttempt.countDocuments({
        user: req.user._id,
        test: test._id,
        status: { $in: ['submitted', 'auto_submitted', 'timed_out'] },
      });
      if (done >= test.maxAttempts) {
        req.flash('error', 'You have used all allowed attempts for this test.');
        return res.redirect(`/tests/${test.slug}`);
      }
    }

    const sections = await buildTestQuestions(test);

    const attempt = await TestAttempt.create({
      user: req.user._id,
      test: test._id,
      company: test.company || null,
      status: 'in_progress',
      startedAt: new Date(),
      durationMinutes: test.durationMinutes,
      answers: sections.flatMap((s) => s.questions.map((q) => ({ question: q._id, section: s.name }))),
    });

    const marks = await Bookmark.find({ user: req.user._id, itemType: 'question', itemId: { $in: sections.flatMap((s) => s.questions.map((q) => q._id)) } }).distinct('itemId');

    res.render('student/test-interface', {
      title: test.title,
      test,
      sections,
      attemptId: attempt._id,
      totalQuestions: sections.reduce((s, sec) => s + sec.questions.length, 0),
      bookmarkIds: marks.map(String),
      instructions: test.instructions,
    });
  } catch (err) {
    next(err);
  }
}

async function submitTest(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id);
    if (!attempt || String(attempt.user) !== String(req.user._id)) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }
    const { answers, timeTaken } = req.body;
    const result = await gradeTest(attempt._id, { answers: answers || [], timeTaken: timeTaken || 0 });
    res.json({ ok: true, resultUrl: `/tests/${result.attempt.test.slug}/result/${result.attempt._id}` });
  } catch (err) {
    if (err.message === 'Attempt already submitted') {
      return res.status(409).json({ error: err.message, resultUrl: `/tests/history` });
    }
    next(err);
  }
}

async function testResult(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId)
      .populate('test')
      .populate('answers.question', 'text options correctOption explanation type difficulty')
      .populate('answers.question.topic', 'name slug')
      .populate('answers.question.subject', 'name slug')
      .lean();

    if (!attempt || String(attempt.user) !== String(req.user._id)) {
      return res.status(404).render('errors/404', { title: 'Result not found' });
    }

    const all = await TestAttempt.find({ test: attempt.test._id, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } }).countDocuments();

    res.render('student/test-result', {
      title: `${attempt.test.title} - Result`,
      attempt,
      totalParticipants: all,
      labels: TEST_TYPE_LABELS,
    });
  } catch (err) {
    next(err);
  }
}

async function testHistory(req, res, next) {
  try {
    const attempts = await TestAttempt.find({ user: req.user._id, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } })
      .populate('test', 'title slug type company')
      .sort({ submittedAt: -1 })
      .lean();

    res.render('student/test-history', { title: 'Test History - GET SELECTED', attempts, labels: TEST_TYPE_LABELS });
  } catch (err) {
    next(err);
  }
}

/** Resume an in-progress attempt after a refresh. */
async function resumeAttempt(req, res, next) {
  try {
    const attempt = await TestAttempt.findOne({ _id: req.params.id, user: req.user._id, status: 'in_progress' });
    if (!attempt) return res.status(404).json({ error: 'No in-progress attempt found.' });

    const test = await Test.findById(attempt.test).lean();
    if (!test) return res.status(404).json({ error: 'Test not found.' });

    const answeredMap = new Map(attempt.answers.filter((a) => a.selected !== null).map((a) => [String(a.question), a.selected]));
    const markedMap = new Map(attempt.answers.filter((a) => a.isMarked).map((a) => [String(a.question), true]));

    const sections = await buildTestQuestions(test, attempt._id ? parseInt(String(attempt._id).slice(0, 4), 10) : 1);

    const data = {
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      durationMinutes: test.durationMinutes,
      sections: sections.map((s) => ({
        name: s.name,
        marksPerQuestion: s.marksPerQuestion,
        negativePerQuestion: s.negativePerQuestion,
        questions: s.questions.map((q) => ({
          _id: q._id,
          text: q.text,
          options: q.options,
          type: q.type,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          selected: answeredMap.has(String(q._id)) ? answeredMap.get(String(q._id)) : null,
          isMarked: !!markedMap.has(String(q._id)),
        })),
      })),
    };
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function testStats(req, res, next) {
  try {
    const test = await Test.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!test) return res.status(404).json({ error: 'Not found' });
    const total = await TestAttempt.countDocuments({ test: test._id, status: { $in: ['submitted', 'auto_submitted'] } });
    const attempts = await TestAttempt.find({ test: test._id, status: { $in: ['submitted', 'auto_submitted'] } }).select('score accuracy timeTaken user').populate('user', 'name').sort({ score: -1 }).limit(50).lean();
    res.json({ total, attempts });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTests, testDetail, startTest, submitTest, testResult, testHistory, resumeAttempt, testStats, TEST_TYPE_LABELS };
