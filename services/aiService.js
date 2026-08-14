const AIAnalysis = require('../models/AIAnalysis');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');
const QuestionAttempt = require('../models/QuestionAttempt');
const TestAttempt = require('../models/TestAttempt');
const { getAnalyticsData } = require('./analyticsService');

function periodDays(period) {
  if (period === 'weekly') return 7;
  if (period === 'monthly') return 30;
  return null;
}

/**
 * Build a plain performance profile that both the AI and the fallback use.
 */
async function buildPerformanceProfile(userId, period) {
  const days = periodDays(period);
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

  const qFilter = { user: userId };
  if (since) qFilter.createdAt = { $gte: since };
  const qAttempts = await QuestionAttempt.find(qFilter).populate('topic', 'name slug').populate('subject', 'name slug').lean();

  const tFilter = { user: userId, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } };
  if (since) tFilter.submittedAt = { $gte: since };
  const attempts = await TestAttempt.find(tFilter).populate('test', 'title type').lean();

  const byTopic = {};
  const bySubject = {};
  for (const a of qAttempts) {
    if (a.topic && a.topic.name) {
      const key = a.topic.slug;
      if (!byTopic[key]) byTopic[key] = { name: a.topic.name, slug: a.topic.slug, subject: a.subject ? a.subject.name : '', subjectSlug: a.subject ? a.subject.slug : '', total: 0, correct: 0, time: 0 };
      byTopic[key].total += 1;
      if (a.correct) byTopic[key].correct += 1;
      byTopic[key].time += a.timeSpent || 0;
    }
    if (a.subject) {
      const key = a.subject.slug;
      if (!bySubject[key]) bySubject[key] = { name: a.subject.name, slug: a.subject.slug, total: 0, correct: 0 };
      bySubject[key].total += 1;
      if (a.correct) bySubject[key].correct += 1;
    }
  }
  for (const at of attempts) {
    for (const ts of at.topicStats || []) {
      const topic = await Topic.findOne({ name: ts.topic });
      const key = topic ? topic.slug : ts.topic.toLowerCase().replace(/\s+/g, '-');
      if (!byTopic[key]) byTopic[key] = { name: ts.topic, slug: key, subject: ts.subject || '', subjectSlug: '', total: 0, correct: 0, time: 0 };
      byTopic[key].total += ts.total;
      byTopic[key].correct += ts.correct;
    }
  }

  const topics = Object.values(byTopic)
    .map((t) => ({ ...t, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0, avgTime: t.total ? Math.round(t.time / t.total) : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy);
  const subjects = Object.values(bySubject).map((s) => ({ ...s, accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0 }));

  return {
    period,
    attempts: attempts.length,
    questionsAttempted: qAttempts.length,
    subjects,
    topics,
    strongestTopic: topics.find((t) => t.total >= 3 && t.accuracy >= 70) || topics[topics.length - 1],
    weakestTopic: topics.find((t) => t.total >= 3 && t.accuracy < 70) || topics[0],
  };
}

function buildFallbackAnalysis(profile) {
  const lines = [];
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  const totalQ = profile.topics.reduce((s, t) => s + t.total, 0);
  const totalC = profile.topics.reduce((s, t) => s + t.correct, 0);
  const overallAccuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;

  if (profile.questionsAttempted === 0 && profile.attempts === 0) {
    lines.push('You have not attempted any questions yet in this period.');
    lines.push('Start with a short practice session to unlock personalized analysis.');
    return {
      summary: lines.join(' '),
      strengths: ['Fresh start - every attempt builds your analysis'],
      weaknesses: ['No practice data yet in this period'],
      recommendations: [
        { title: 'Start with a Quick Quiz', description: 'Solve 5-8 questions to get your first performance snapshot.', action: 'test', link: '/tests' },
      ],
      isFallback: true,
    };
  }

  const subjectLines = profile.subjects
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((s) => `${s.name} accuracy is ${s.accuracy}% across ${s.total} questions.`);

  const weak = profile.topics.filter((t) => t.total >= 3 && t.accuracy < 70).slice(0, 3);
  const strong = profile.topics.filter((t) => t.total >= 3 && t.accuracy >= 75).slice(0, 3);

  if (overallAccuracy > 0) lines.push(`Your overall accuracy is ${overallAccuracy}% across ${totalQ} practice questions.`);
  if (subjectLines.length) lines.push(subjectLines.join(' '));

  if (weak.length) {
    for (const t of weak.slice(0, 2)) {
      lines.push(`${t.name} accuracy is ${t.accuracy}%${t.avgTime ? ` with an average of ${t.avgTime}s per question` : ''}.`);
    }
    lines.push(`Current priority: ${weak[0].name}`);
    weaknesses.push(`${weak[0].name} needs attention - accuracy is ${weak[0].accuracy}%.`);
  }

  if (strong.length) strengths.push(`${strong[0].name} is a strength at ${strong[0].accuracy}% accuracy.`);

  if (profile.attempts) lines.push(`You have completed ${profile.attempts} test${profile.attempts > 1 ? 's' : ''} in this period.`);

  for (const t of weak.slice(0, 3)) {
    recommendations.push({
      title: `Practice ${t.name}`,
      description: `Your accuracy in ${t.name} is ${t.accuracy}%. Build confidence with focused practice.`,
      subject: t.subject,
      topic: t.name,
      subjectSlug: t.subjectSlug,
      topicSlug: t.slug,
      action: 'practice',
      link: `/practice?subject=${t.subjectSlug}&topic=${t.slug}`,
    });
    recommendations.push({
      title: `${t.name} Timed Test`,
      description: `Validate your improvement with a timed ${t.name} test.`,
      subject: t.subject,
      topic: t.name,
      action: 'test',
      link: `/tests`,
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      title: 'Maintain your momentum',
      description: 'Your recent practice looks strong. Push into harder difficulty questions to keep improving.',
      action: 'practice',
      link: '/practice',
    });
  }

  return {
    summary: lines.join(' '),
    strengths,
    weaknesses,
    recommendations,
    isFallback: true,
  };
}

async function generateAnalysis(userId, period = 'overall', force = false) {
  const existing = await AIAnalysis.findOne({ user: userId, period }).sort({ createdAt: -1 }).lean();
  if (existing && !force) return existing;

  const profile = await buildPerformanceProfile(userId, period);
  let result;

  if (process.env.AI_API_KEY) {
    result = await callAI(profile);
  }

  if (!result) {
    result = buildFallbackAnalysis(profile);
  }

  const doc = await AIAnalysis.create({
    user: userId,
    period,
    summary: result.summary,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    recommendations: result.recommendations,
    stats: { profile },
    isFallback: result.isFallback !== false,
  });

  return doc;
}

async function callAI(profile) {
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const key = process.env.AI_API_KEY;

  const prompt = `You analyze engineering placement test preparation data for the free platform GET SELECTED.
Provide a concise performance analysis in strict JSON with this shape:
{"summary":"string","strengths":["string"],"weaknesses":["string"],"recommendations":[{"title":"string","description":"string","subject":"string","topic":"string","action":"practice|test|learn","link":"string"}]}

Recommendations MUST reference real GET SELECTED content areas from the data below (topics/subjects). Do not give career advice.

Data: ${JSON.stringify(profile)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature: 0.4, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[ai] provider returned ${res.status} - using fallback`);
      return null;
    }
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed.summary || !parsed.recommendations) return null;
    return { ...parsed, isFallback: false };
  } catch (err) {
    console.warn('[ai] analysis call failed - using fallback:', err.message);
    return null;
  }
}

module.exports = { generateAnalysis, buildPerformanceProfile };
