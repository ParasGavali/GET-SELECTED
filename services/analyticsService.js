const TestAttempt = require('../models/TestAttempt');
const QuestionAttempt = require('../models/QuestionAttempt');
const CodeSubmission = require('../models/CodeSubmission');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');

async function getDashboardStats(userId) {
  const [attempts, qAttempts, submissions, topics] = await Promise.all([
    TestAttempt.find({ user: userId, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } })
      .sort({ submittedAt: -1 })
      .populate('test', 'title slug type subject company')
      .lean(),
    QuestionAttempt.find({ user: userId }).lean(),
    CodeSubmission.find({ user: userId }).countDocuments(),
    Topic.find().populate('subject', 'name slug color').lean(),
  ]);

  const questionsSolved = qAttempts.length;
  const correctCount = qAttempts.filter((a) => a.correct).length;
  const practiceAccuracy = questionsSolved ? Math.round((correctCount / questionsSolved) * 100) : 0;
  const testsCompleted = attempts.length;
  const totalScore = attempts.reduce((s, a) => s + a.score, 0);
  const totalMax = attempts.reduce((s, a) => s + (a.maxScore || 1), 0);
  const overallAccuracy = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length) : 0;
  const avgTime = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.timeTaken, 0) / attempts.length) : 0;

  // Subject performance from test attempts + practice
  const subjectStats = {};
  const topicStats = {};

  for (const a of qAttempts) {
    if (!a.subject) continue;
    const key = String(a.subject);
    if (!subjectStats[key]) subjectStats[key] = { subjectId: a.subject, total: 0, correct: 0, source: 'practice' };
    subjectStats[key].total += 1;
    if (a.correct) subjectStats[key].correct += 1;

    if (a.topic) {
      const tKey = String(a.topic);
      if (!topicStats[tKey]) topicStats[tKey] = { topicId: a.topic, subjectId: a.subject, total: 0, correct: 0, time: 0 };
      topicStats[tKey].total += 1;
      if (a.correct) topicStats[tKey].correct += 1;
      topicStats[tKey].time += a.timeSpent || 0;
    }
  }

  for (const at of attempts) {
    const sections = at.sectionStats || [];
    for (const s of sections) {
      const subject = topics.find((t) => t.name.toLowerCase() === s.section.toLowerCase());
      // section names may equal subject or topic names; map via topicStats section data
    }
    for (const ts of at.topicStats || []) {
      const t = topics.find((x) => x.name === ts.topic || x.slug === ts.topic);
      const key = t ? String(t._id) : ts.topic;
      if (!topicStats[key]) {
        topicStats[key] = { topicId: t ? t._id : null, subjectId: t ? t.subject._id : null, total: 0, correct: 0, time: 0, label: ts.topic };
      }
      topicStats[key].total += ts.total;
      topicStats[key].correct += ts.correct;
    }
  }

  const subjectRows = Object.values(subjectStats).map((s) => {
    const subj = topics.find((t) => String(t.subject._id) === String(s.subjectId));
    const accuracy = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    return { name: subj ? subj.subject.name : 'Unknown', slug: subj ? subj.subject.slug : '', color: subj ? subj.subject.color : '#64748b', total: s.total, correct: s.correct, accuracy };
  });

  const topicRows = Object.values(topicStats).map((t) => {
    const topic = topics.find((x) => String(x._id) === String(t.topicId));
    const accuracy = t.total ? Math.round((t.correct / t.total) * 100) : 0;
    const avgTime = t.total ? Math.round(t.time / t.total) : 0;
    return {
      name: topic ? topic.name : t.label || 'Unknown',
      slug: topic ? topic.slug : '',
      subject: topic && topic.subject ? topic.subject.name : '',
      subjectSlug: topic && topic.subject ? topic.subject.slug : '',
      total: t.total,
      correct: t.correct,
      accuracy,
      avgTime,
    };
  });

  topicRows.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
  const weakTopics = topicRows.filter((t) => t.total >= 3 && t.accuracy < 70).slice(0, 5);
  const strongTopics = topicRows.filter((t) => t.total >= 3 && t.accuracy >= 75).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);

  const trend = attempts.slice(0, 10).reverse().map((a) => ({
    date: a.submittedAt,
    label: a.test ? a.test.title : 'Test',
    score: a.score,
    maxScore: a.maxScore,
    accuracy: a.accuracy,
  }));

  return {
    attempts,
    recentTests: attempts.slice(0, 6),
    testsCompleted,
    questionsSolved,
    practiceAccuracy,
    overallAccuracy,
    totalScore,
    totalMax,
    avgTime,
    codingSolved: submissions,
    subjectRows,
    topicRows,
    weakTopics,
    strongTopics,
    trend,
  };
}

/** Detailed analytics for the analytics page (subject/difficulty/topic breakdown). */
async function getAnalyticsData(userId) {
  const [subjects, attempts] = await Promise.all([
    Subject.find().sort('order').lean(),
    TestAttempt.find({ user: userId, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } }).populate('test', 'title type').sort({ submittedAt: -1 }).lean(),
  ]);

  const qAttempts = await QuestionAttempt.find({ user: userId }).populate('subject', 'name slug').populate('topic', 'name slug').lean();

  // Score & accuracy trend (by test)
  const scoreTrend = attempts.slice(0, 15).reverse().map((a) => ({
    label: a.test ? a.test.title.slice(0, 22) : 'Test',
    score: a.score,
    max: a.maxScore,
    accuracy: a.accuracy,
    date: a.submittedAt,
  }));

  // Questions solved per day (last 14 days)
  const daily = {};
  const start = new Date();
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    daily[d.toISOString().slice(0, 10)] = 0;
  }
  for (const a of qAttempts) {
    const day = new Date(a.createdAt).toISOString().slice(0, 10);
    if (day in daily) daily[day] += 1;
  }
  const dailyActivity = Object.entries(daily).map(([date, count]) => ({ date, count }));

  // Subject performance
  const bySubject = {};
  for (const a of qAttempts) {
    if (!a.subject) continue;
    const key = a.subject.slug;
    if (!bySubject[key]) bySubject[key] = { name: a.subject.name, slug: a.subject.slug, total: 0, correct: 0 };
    bySubject[key].total += 1;
    if (a.correct) bySubject[key].correct += 1;
  }
  const subjectPerformance = Object.values(bySubject).map((s) => ({
    ...s,
    accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  // Topic performance
  const byTopic = {};
  for (const a of qAttempts) {
    if (!a.topic) continue;
    const key = a.topic.slug;
    if (!byTopic[key]) byTopic[key] = { name: a.topic.name, slug: a.topic.slug, subject: a.subject ? a.subject.name : '', subjectSlug: a.subject ? a.subject.slug : '', total: 0, correct: 0, time: 0 };
    byTopic[key].total += 1;
    if (a.correct) byTopic[key].correct += 1;
    byTopic[key].time += a.timeSpent || 0;
  }
  let topicPerformance = Object.values(byTopic).map((t) => ({
    ...t,
    accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
    avgTime: t.total ? Math.round(t.time / t.total) : 0,
  }));
  topicPerformance.sort((a, b) => b.total - a.total);

  // Difficulty performance (from test answers via topicStats is not tracked; use question attempts by difficulty)
  const byDifficulty = {};
  const qIds = qAttempts.map((a) => a.question);
  const diffs = await Question.find({ _id: { $in: qIds } }).select('_id difficulty').lean();
  const diffMap = new Map(diffs.map((d) => [String(d._id), d.difficulty]));
  for (const a of qAttempts) {
    const diff = diffMap.get(String(a.question)) || 'unknown';
    if (!byDifficulty[diff]) byDifficulty[diff] = { name: diff, total: 0, correct: 0 };
    byDifficulty[diff].total += 1;
    if (a.correct) byDifficulty[diff].correct += 1;
  }
  const difficultyPerformance = Object.entries(byDifficulty).map(([k, v]) => ({ name: k, total: v.total, accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0 }));

  return {
    subjects,
    attempts,
    scoreTrend,
    dailyActivity,
    subjectPerformance,
    topicPerformance,
    difficultyPerformance,
    totals: {
      questions: qAttempts.length,
      correct: qAttempts.filter((a) => a.correct).length,
      accuracy: qAttempts.length ? Math.round((qAttempts.filter((a) => a.correct).length / qAttempts.length) * 100) : 0,
      tests: attempts.length,
      avgTime: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.timeTaken, 0) / attempts.length) : 0,
    },
  };
}

module.exports = { getDashboardStats, getAnalyticsData };
