const DailyChallenge = require('../models/DailyChallenge');
const DailyChallengeResult = require('../models/DailyChallengeResult');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const QuestionAttempt = require('../models/QuestionAttempt');
const Subject = require('../models/Subject');

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_CONFIG = { aptitude: 5, reasoning: 5, technical: 5, coding: 1 };

async function ensureTodayChallenge() {
  const date = todayKey();
  let challenge = await DailyChallenge.findOne({ date });
  if (challenge && challenge.isActive) return challenge;

  const subjects = await Subject.find({ code: { $in: ['APT', 'LOGICAL', 'TECHNICAL'] } }).lean();
  const byCode = new Map(subjects.map((s) => [s.code, s]));
  const aptitude = byCode.get('APT');
  const reasoning = byCode.get('LOGICAL');
  const technical = byCode.get('TECHNICAL');

  const pick = async (subjectId, n) => {
    const qs = await Question.find({ subject: subjectId, isActive: true, type: { $ne: 'sql' } }).limit(n * 4).lean();
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    return qs.slice(0, n).map((q) => q._id);
  };

  const [aptIds, reasoningIds, techIds, codingProblem] = await Promise.all([
    aptitude ? pick(aptitude._id, DEFAULT_CONFIG.aptitude) : [],
    reasoning ? pick(reasoning._id, DEFAULT_CONFIG.reasoning) : [],
    technical ? pick(technical._id, DEFAULT_CONFIG.technical) : [],
    CodingProblem.aggregate([{ $match: { isActive: true } }, { $sample: { size: 1 } }, { $project: { _id: 1 } }]),
  ]);

  challenge = await DailyChallenge.create({
    date,
    title: `Daily Placement Challenge - ${date}`,
    description: 'Aptitude, Reasoning, Technical and Coding - solve it before the day ends.',
    questions: [...aptIds, ...reasoningIds, ...techIds],
    codingProblem: codingProblem.length ? codingProblem[0]._id : null,
    isActive: true,
  });

  return challenge;
}

async function dailyPage(req, res, next) {
  try {
    const challenge = await ensureTodayChallenge();
    const [questions, codingProblem, result] = await Promise.all([
      Question.find({ _id: { $in: challenge.questions } }).populate('topic', 'name slug').populate('subject', 'name slug color').lean(),
      challenge.codingProblem ? CodingProblem.findById(challenge.codingProblem).lean() : Promise.resolve(null),
      DailyChallengeResult.findOne({ user: req.user._id, challenge: challenge._id }).lean(),
    ]);

    const past = await DailyChallengeResult.find({ user: req.user._id }).sort({ submittedAt: -1 }).limit(10).populate('challenge', 'date title').lean();

    res.render('student/daily-challenge', { title: 'Daily Placement Challenge - GET SELECTED', challenge, questions, codingProblem, result, past });
  } catch (err) {
    next(err);
  }
}

async function submitDaily(req, res, next) {
  try {
    const challenge = await ensureTodayChallenge();
    const { answers, timeTaken } = req.body;
    const questions = await Question.find({ _id: { $in: challenge.questions } }).lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));

    const answerDocs = [];
    let correct = 0;
    let attempted = 0;
    for (const q of questions) {
      const sel = answers && answers[String(q._id)] !== undefined ? Number(answers[String(q._id)]) : null;
      const isCorrect = sel !== null && sel === q.correctOption;
      answerDocs.push({ question: q._id, selected: sel, isCorrect });
      if (sel !== null) attempted += 1;
      if (isCorrect) correct += 1;
    }

    const existing = await DailyChallengeResult.findOne({ user: req.user._id, challenge: challenge._id });
    if (existing) return res.status(409).json({ error: 'You have already completed today\'s challenge.' });

    await DailyChallengeResult.create({
      user: req.user._id,
      challenge: challenge._id,
      answers: answerDocs,
      score: correct,
      correct,
      attempted,
      accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
      timeTaken: Number(timeTaken) || 0,
    });

    // Record question attempts for analytics
    const qaDocs = answerDocs
      .filter((a) => a.selected !== null)
      .map((a) => ({
        user: req.user._id,
        question: a.question,
        subject: qMap.get(String(a.question)).subject,
        topic: qMap.get(String(a.question)).topic,
        mode: 'daily',
        correct: a.isCorrect,
        timeSpent: 0,
      }));
    if (qaDocs.length) await QuestionAttempt.insertMany(qaDocs);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { dailyPage, submitDaily, ensureTodayChallenge };
