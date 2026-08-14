const TestAttempt = require('../models/TestAttempt');

/**
 * Compute rank and percentile for a single attempt within its test.
 * Percentile formula: share of participants ranked below this attempt.
 * With a single participant the attempt is the top score (100th percentile).
 */
async function computeAttemptRanking(attemptId) {
  const attempt = await TestAttempt.findById(attemptId).lean();
  if (!attempt || attempt.status === 'in_progress') return null;

  const total = await TestAttempt.countDocuments({ test: attempt.test, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } });
  const higher = await TestAttempt.countDocuments({
    test: attempt.test,
    status: { $in: ['submitted', 'auto_submitted', 'timed_out'] },
    $or: [{ score: { $gt: attempt.score } }, { score: attempt.score, submittedAt: { $lt: attempt.submittedAt || new Date() } }],
  });

  const rank = higher + 1;
  const percentile = total <= 1 ? 100 : Math.round(((total - rank) / (total - 1)) * 100);

  await TestAttempt.updateOne({ _id: attemptId }, { $set: { rank, percentile } });
  return { rank, percentile, total };
}

/**
 * Overall ranking across all students using aggregate preparation points.
 * Points = sum of (score) across submitted attempts.
 */
async function getOverallRanking(limit = 100) {
  return TestAttempt.aggregate([
    { $match: { status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } } },
    { $group: { _id: '$user', points: { $sum: '$score' }, tests: { $sum: 1 }, accuracySum: { $sum: '$accuracy' } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $match: { 'u.isActive': true } },
    { $project: { user: '$_id', name: '$u.name', points: 1, tests: 1, avgAccuracy: { $cond: [{ $gt: ['$tests', 0] }, { $divide: ['$accuracySum', '$tests'] }, 0] } } },
    { $sort: { points: -1, avgAccuracy: -1 } },
    { $limit: limit },
  ]);
}

/** Ranking over a time window (days) for weekly/monthly leaderboards. */
async function getPeriodRanking(days, limit = 100) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return TestAttempt.aggregate([
    { $match: { status: { $in: ['submitted', 'auto_submitted', 'timed_out'] }, submittedAt: { $gte: since } } },
    { $group: { _id: '$user', points: { $sum: '$score' }, tests: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $match: { 'u.isActive': true } },
    { $project: { user: '$_id', name: '$u.name', points: 1, tests: 1 } },
    { $sort: { points: -1 } },
    { $limit: limit },
  ]);
}

/** Compute a user's rank + percentile on a given test. */
async function getUserTestRank(userId, testId) {
  const attempt = await TestAttempt.findOne({ user: userId, test: testId, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } })
    .sort({ score: -1, submittedAt: 1 })
    .lean();
  return attempt ? { rank: attempt.rank, percentile: attempt.percentile, attemptId: attempt._id, score: attempt.score } : null;
}

module.exports = { computeAttemptRanking, getOverallRanking, getPeriodRanking, getUserTestRank };
