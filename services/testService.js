const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const QuestionAttempt = require('../models/QuestionAttempt');
const { computeAttemptRanking } = require('./rankingService');

/**
 * Build the ordered list of questions for a test, honoring randomization.
 * Returns [{ section, question }] where question is a lean Question doc.
 */
async function buildTestQuestions(test, seed = null) {
  const sections = [];
  const seen = new Set();

  for (const section of test.sections || []) {
    const ids = section.questions || [];
    let questions = await Question.find({ _id: { $in: ids }, isActive: true }).lean();
    const orderMap = new Map(ids.map((id, i) => [String(id), i]));
    questions.sort((a, b) => orderMap.get(String(a._id)) - orderMap.get(String(b._id)));

    if (test.randomization) {
      let rng = Math.random;
      if (seed !== null && seed !== undefined) {
        rng = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
      }
      questions = shuffle(questions, rng);
    }

    questions.forEach((q) => seen.add(String(q._id)));
    sections.push({ name: section.name, questions, marksPerQuestion: section.marksPerQuestion || 1, negativePerQuestion: section.negativePerQuestion || 0 });
  }

  return sections;
}

function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Grade a submitted test.
 * payload: { answers: [{ question, selected }], timeTaken }
 */
async function gradeTest(attemptId, payload) {
  const attempt = await TestAttempt.findById(attemptId).populate('test').populate('user');
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.status !== 'in_progress') throw new Error('Attempt already submitted');

  const test = attempt.test;
  const answersByQ = new Map((payload.answers || []).map((a) => [String(a.question), a.selected]));

  const qIds = test.sections.flatMap((s) => s.questions);
  const questions = await Question.find({ _id: { $in: qIds } }).populate('topic', 'name slug subject').lean();
  const qMap = new Map(questions.map((q) => [String(q._id), q]));

  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  const answerDocs = [];
  const sectionStats = [];
  const topicMap = new Map();

  for (const section of test.sections) {
    const secQuestions = (section.questions || []).filter((id) => qMap.has(String(id)));
    const marksPer = section.marksPerQuestion || 1;
    const negativePer = test.negativeMarking ? section.negativePerQuestion || 0.25 : 0;
    let secTotal = 0;
    let secCorrect = 0;
    let secIncorrect = 0;
    let secSkipped = 0;
    let secScore = 0;

    for (const id of secQuestions) {
      const q = qMap.get(String(id));
      const selected = answersByQ.has(String(id)) ? answersByQ.get(String(id)) : null;
      const isCorrect = selected !== null && selected === q.correctOption;
      const attempted = selected !== null;

      maxScore += marksPer;
      secTotal += 1;

      answerDocs.push({
        question: q._id,
        section: section.name,
        selected,
        isCorrect,
        correctOption: q.correctOption,
        isMarked: false,
        timeSpent: 0,
      });

      if (isCorrect) {
        score += marksPer;
        secScore += marksPer;
        correct += 1;
        secCorrect += 1;
      } else if (attempted) {
        score -= negativePer;
        secScore -= negativePer;
        incorrect += 1;
        secIncorrect += 1;
      } else {
        skipped += 1;
        secSkipped += 1;
      }

      const topic = q.topic;
      if (topic) {
        const key = String(topic._id);
        if (!topicMap.has(key)) topicMap.set(key, { topic: topic.name, subject: topic.subject ? topic.subject.name : '', total: 0, correct: 0 });
        const entry = topicMap.get(key);
        entry.total += 1;
        if (isCorrect) entry.correct += 1;
      }
    }

    sectionStats.push({
      section: section.name,
      total: secTotal,
      correct: secCorrect,
      incorrect: secIncorrect,
      skipped: secSkipped,
      score: Math.round(secScore * 100) / 100,
      accuracy: secTotal ? Math.round((secCorrect / secTotal) * 100) : 0,
    });
  }

  const topicStats = [...topicMap.values()].map((t) => ({
    topic: t.topic,
    subject: t.subject,
    total: t.total,
    correct: t.correct,
    accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
  }));

  score = Math.round(score * 100) / 100;
  maxScore = Math.round(maxScore * 100) / 100;
  const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  attempt.answers = answerDocs;
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.correct = correct;
  attempt.incorrect = incorrect;
  attempt.skipped = skipped;
  attempt.totalQuestions = qIds.length;
  attempt.accuracy = accuracy;
  attempt.timeTaken = Math.min(payload.timeTaken || 0, test.durationMinutes * 60);
  attempt.sectionStats = sectionStats;
  attempt.topicStats = topicStats;
  await attempt.save();

  // Update test attempt count
  const Test = require('../models/Test');
  await Test.updateOne({ _id: test._id }, { $inc: { attemptsCount: 1 } });

  // Record per-question attempts for analytics
  const qaDocs = answerDocs
    .filter((a) => a.selected !== null)
    .map((a) => {
      const q = qMap.get(String(a.question));
      return {
        user: attempt.user._id,
        question: a.question,
        subject: q ? q.subject : null,
        topic: q && q.topic ? q.topic._id : null,
        mode: 'test',
        correct: a.isCorrect,
        timeSpent: 0,
      };
    });
  if (qaDocs.length) await QuestionAttempt.insertMany(qaDocs);

  const ranking = await computeAttemptRanking(attempt._id);
  return { attempt: await TestAttempt.findById(attempt._id).populate('test').populate('user').lean(), ranking };
}

module.exports = { buildTestQuestions, gradeTest };
