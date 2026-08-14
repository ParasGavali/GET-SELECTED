const { getDashboardStats, getAnalyticsData } = require('../services/analyticsService');
const { generateAnalysis } = require('../services/aiService');
const { getOverallRanking, getPeriodRanking } = require('../services/rankingService');
const TestAttempt = require('../models/TestAttempt');

async function dashboard(req, res, next) {
  try {
    const [stats, overallRank] = await Promise.all([
      getDashboardStats(req.user._id),
      getOverallRanking(500),
    ]);

    const myIndex = overallRank.findIndex((r) => String(r.user) === String(req.user._id));
    let ranking = null;
    if (myIndex >= 0) {
      const total = overallRank.length;
      ranking = {
        rank: myIndex + 1,
        total,
        points: overallRank[myIndex].points,
        percentile: total <= 1 ? 100 : Math.round(((total - (myIndex + 1)) / (total - 1)) * 100),
      };
    }

    res.render('student/dashboard', { title: 'Dashboard - GET SELECTED', stats, ranking });
  } catch (err) {
    next(err);
  }
}

async function analytics(req, res, next) {
  try {
    const data = await getAnalyticsData(req.user._id);
    res.render('student/analytics', { title: 'Analytics - GET SELECTED', data });
  } catch (err) {
    next(err);
  }
}

async function aiAnalysisPage(req, res, next) {
  try {
    const period = req.query.period || 'overall';
    const analysis = await generateAnalysis(req.user._id, period, req.query.refresh === '1');
    res.render('student/ai-analysis', { title: 'AI Performance Analysis - GET SELECTED', analysis, period });
  } catch (err) {
    next(err);
  }
}

async function leaderboard(req, res, next) {
  try {
    const [overall, weekly, monthly] = await Promise.all([
      getOverallRanking(100),
      getPeriodRanking(7, 100),
      getPeriodRanking(30, 100),
    ]);

    const attachMe = (list) => {
      const idx = list.findIndex((r) => String(r.user) === String(req.user._id));
      return { list, me: idx >= 0 ? { ...list[idx], rank: idx + 1 } : null };
    };

    res.render('student/leaderboard', {
      title: 'Leaderboard - GET SELECTED',
      overall: attachMe(overall),
      weekly: attachMe(weekly),
      monthly: attachMe(monthly),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, analytics, aiAnalysisPage, leaderboard };
