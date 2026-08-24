const Question = require('../models/Question');
const QuestionAttempt = require('../models/QuestionAttempt');
const TestAttempt = require('../models/TestAttempt');
const { positions, getPositionBySlug, POSITION_SLUGS } = require('../config/positions');

function flattenModules(pos) {
  if (pos.phases) {
    return pos.phases.flatMap((phase) =>
      phase.modules.map((mod) => ({ ...mod, phase: phase.name, phaseDescription: phase.description }))
    );
  }
  return pos.modules || [];
}

async function listPositions(req, res, next) {
  try {
    const user = req.user;
    const allQuestions = await Question.find({ isActive: true })
      .populate('subject', 'code')
      .populate('topic', 'slug')
      .lean();

    const positionStats = await Promise.all(
      positions.map(async (pos) => {
        const modules = flattenModules(pos);
        const subjectNames = [...new Set(modules.flatMap((m) => m.subjects))];
        const topicSlugs = modules.flatMap((m) => m.topics);

        const matching = allQuestions.filter(
          (q) => subjectNames.includes(q.subject?.code) && topicSlugs.includes(q.topic?.slug)
        );

        let attempted = 0;
        let correct = 0;
        if (user) {
          const questionIds = matching.map((q) => q._id);
          if (questionIds.length) {
            const attempts = await QuestionAttempt.find({ user: user._id, question: { $in: questionIds } }).lean();
            attempted = attempts.length;
            correct = attempts.filter((a) => a.correct).length;
          }
        }

        return {
          ...pos,
          totalQuestions: matching.length,
          attempted,
          correct,
          progress: matching.length ? Math.round((attempted / matching.length) * 100) : 0,
        };
      })
    );

    res.render('student/positions-list', { title: 'Career Positions - GET SELECTED', positions: positionStats });
  } catch (err) {
    next(err);
  }
}

async function positionDetail(req, res, next) {
  try {
    const pos = getPositionBySlug(req.params.slug);
    if (!pos) {
      req.flash('error', 'Position not found.');
      return res.redirect('/positions');
    }

    const user = req.user;
    const allQuestions = await Question.find({ isActive: true })
      .populate('subject', 'code name slug')
      .populate('topic', 'slug name')
      .lean();

    const phases = pos.phases || [{ name: 'Modules', description: '', modules: pos.modules }];
    const phaseResults = await Promise.all(
      phases.map(async (phase) => {
        const moduleResults = await Promise.all(
          phase.modules.map(async (mod) => {
            const subjectCodes = mod.subjects;
            const matching = allQuestions.filter(
              (q) => subjectCodes.includes(q.subject?.code) && mod.topics.includes(q.topic?.slug)
            );

            let attempted = 0;
            let correct = 0;
            if (user) {
              const questionIds = matching.map((q) => q._id);
              if (questionIds.length) {
                const attempts = await QuestionAttempt.find({ user: user._id, question: { $in: questionIds } }).lean();
                attempted = attempts.length;
                correct = attempts.filter((a) => a.correct).length;
              }
            }

            const topicBreakdown = {};
            for (const q of matching) {
              const slug = q.topic?.slug || 'unknown';
              if (!topicBreakdown[slug]) topicBreakdown[slug] = { name: q.topic?.name || slug, total: 0, attempted: 0, correct: 0 };
              topicBreakdown[slug].total++;
            }
            if (user) {
              for (const q of matching) {
                const slug = q.topic?.slug || 'unknown';
                if (topicBreakdown[slug]) topicBreakdown[slug].attempted++;
              }
            }

            return {
              name: mod.name,
              totalQuestions: matching.length,
              attempted,
              correct,
              accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
              progress: matching.length ? Math.round((attempted / matching.length) * 100) : 0,
              topics: Object.values(topicBreakdown),
              subjectCodes: mod.subjects,
            };
          })
        );

        const totalAll = moduleResults.reduce((s, m) => s + m.totalQuestions, 0);
        const attemptedAll = moduleResults.reduce((s, m) => s + m.attempted, 0);
        const correctAll = moduleResults.reduce((s, m) => s + m.correct, 0);

        return {
          name: phase.name,
          description: phase.description,
          modules: moduleResults,
          totalQuestions: totalAll,
          attempted: attemptedAll,
          correct: correctAll,
          progress: totalAll ? Math.round((attemptedAll / totalAll) * 100) : 0,
        };
      })
    );

    const totalAll = phaseResults.reduce((s, p) => s + p.totalQuestions, 0);
    const attemptedAll = phaseResults.reduce((s, p) => s + p.attempted, 0);
    const correctAll = phaseResults.reduce((s, p) => s + p.correct, 0);

    res.render('student/position-detail', {
      title: `${pos.name} - GET SELECTED`,
      position: pos,
      phases: phaseResults,
      overallStats: {
        total: totalAll,
        attempted: attemptedAll,
        correct: correctAll,
        accuracy: attemptedAll ? Math.round((correctAll / attemptedAll) * 100) : 0,
        progress: totalAll ? Math.round((attemptedAll / totalAll) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function positionMockTest(req, res, next) {
  try {
    const pos = getPositionBySlug(req.params.slug);
    if (!pos) {
      req.flash('error', 'Position not found.');
      return res.redirect('/positions');
    }

    const modules = flattenModules(pos);
    const subjectNames = [...new Set(modules.flatMap((m) => m.subjects))];
    const topicSlugs = modules.flatMap((m) => m.topics);

    const questions = await Question.find({ isActive: true })
      .populate('subject', 'code name slug')
      .populate('topic', 'slug name')
      .lean();

    const matching = questions.filter(
      (q) => subjectNames.includes(q.subject?.code) && topicSlugs.includes(q.topic?.slug)
    );

    if (!matching.length) {
      req.flash('error', 'No questions available for this position yet.');
      return res.redirect(`/positions/${pos.slug}`);
    }

    const shuffled = matching.sort(() => Math.random() - 0.5).slice(0, Math.min(30, matching.length));

    const Test = require('../models/Test');
    const mockTest = {
      title: `${pos.name} Mock Test`,
      slug: `${pos.slug}-mock-${Date.now()}`,
      description: `A comprehensive mock test for ${pos.name} role preparation.`,
      type: 'mock',
      durationMinutes: 30,
      negativeMarking: true,
      randomization: true,
      isPublished: true,
      sections: [{ name: pos.name, questions: shuffled.map((q) => q._id), marksPerQuestion: 1, negativePerQuestion: 0.25 }],
    };

    const test = await Test.findOneAndUpdate({ slug: mockTest.slug }, mockTest, { upsert: true, new: true });

    req.flash('success', `Starting ${pos.name} mock test with ${shuffled.length} questions.`);
    res.redirect(`/tests/${test.slug}`);
  } catch (err) {
    next(err);
  }
}

module.exports = { listPositions, positionDetail, positionMockTest, POSITIONS: positions, POSITION_SLUGS };
