const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Test = require('../models/Test');
const Company = require('../models/Company');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');

async function home(req, res, next) {
  try {
    const [subjects, featuredTests, companies, qCount, codeCount, attemptCount, userCount] = await Promise.all([
      Subject.find({ isActive: true }).sort('order').lean(),
      Test.find({ isPublished: true, featured: true }).populate('company', 'name slug').sort({ createdAt: -1 }).limit(6).lean(),
      Company.find({ isActive: true }).sort('order').limit(9).lean(),
      Question.countDocuments({ isActive: true }),
      CodingProblem.countDocuments({ isActive: true }),
      TestAttempt.countDocuments({ status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } }),
      User.countDocuments({ isActive: true, role: 'student' }),
    ]);

    const topics = await Topic.find({ isActive: true }).populate('subject', 'name slug').lean();
    const subjectTopicMap = subjects.reduce((acc, s) => {
      acc[String(s._id)] = topics.filter((t) => String(t.subject._id) === String(s._id)).slice(0, 6);
      return acc;
    }, {});

    res.render('public/home', {
      title: 'GET SELECTED - Practice. Prepare. Get Selected.',
      subjects,
      subjectTopicMap,
      featuredTests,
      companies,
      stats: { qCount, codeCount, attemptCount, userCount },
      topTests: featuredTests,
    });
  } catch (err) {
    next(err);
  }
}

async function about(req, res) {
  res.render('public/about', { title: 'About GET SELECTED' });
}

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const results = { q, questions: [], tests: [], topics: [], companies: [], coding: [] };

    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [questions, tests, topics, companies, coding] = await Promise.all([
        Question.find({ $or: [{ text: re }, { tags: { $in: [q] } }], isActive: true }).limit(12).populate('subject', 'name slug').populate('topic', 'name slug').lean(),
        Test.find({ $or: [{ title: re }, { description: re }], isPublished: true }).limit(8).populate('company', 'name slug').lean(),
        Topic.find({ $or: [{ name: re }, { description: re }] }).limit(8).populate('subject', 'name slug').lean(),
        Company.find({ $or: [{ name: re }, { description: re }], isActive: true }).limit(6).lean(),
        CodingProblem.find({ $or: [{ title: re }, { tags: { $in: [q] } }], isActive: true }).limit(6).lean(),
      ]);
      results.questions = questions;
      results.tests = tests;
      results.topics = topics;
      results.companies = companies;
      results.coding = coding;
    }

    res.render('public/search', { title: `Search${q ? `: ${q}` : ''}`, results });
  } catch (err) {
    next(err);
  }
}

module.exports = { home, about, search };
