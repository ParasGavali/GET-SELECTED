const User = require('../models/User');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const QuestionAttempt = require('../models/QuestionAttempt');
const Company = require('../models/Company');
const CodingProblem = require('../models/CodingProblem');
const DailyChallenge = require('../models/DailyChallenge');
const DailyChallengeResult = require('../models/DailyChallengeResult');
const { parse } = require('csv-parse/sync');

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadSubjectsAndTopics() {
  const [subjects, topics] = await Promise.all([
    Subject.find().sort('order').lean(),
    Topic.find().populate('subject', 'name slug').sort('order').lean(),
  ]);
  return { subjects, topics };
}

async function resolveCompanyIds(names) {
  const list = Array.isArray(names) ? names : String(names || '').split(',').map((s) => s.trim());
  const unique = [...new Set(list.filter(Boolean))];
  if (!unique.length) return [];
  const companies = await Company.find({ name: { $in: unique } }).select('_id').lean();
  return companies.map((c) => c._id);
}

// ---------- Dashboard ----------

async function adminDashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalStudents, activeToday, testsAttempted, qAttempted, questions, tests, companies, dailyActivity, popularTests, codingProblems] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', lastActiveAt: { $gte: today } }),
      TestAttempt.countDocuments({ status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } }),
      QuestionAttempt.countDocuments({ createdAt: { $gte: weekAgo } }),
      Question.countDocuments(),
      Test.countDocuments(),
      Company.countDocuments(),
      QuestionAttempt.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      TestAttempt.aggregate([
        { $match: { status: { $in: ['submitted', 'auto_submitted'] } } },
        { $group: { _id: '$test', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      CodingProblem.countDocuments(),
    ]);

    const testIds = popularTests.map((p) => p._id);
    const popTests = await Test.find({ _id: { $in: testIds } }).select('title slug type company').populate('company', 'name').lean();
    const popularTestsData = popularTests.map((p) => {
      const t = popTests.find((x) => String(x._id) === String(p._id));
      return { count: p.count, title: t ? t.title : 'Unknown', slug: t ? t.slug : '' };
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - GET SELECTED',
      stats: { totalStudents, activeToday, testsAttempted, qAttempted, questions, tests, companies, codingProblems },
      dailyActivity,
      popularTests: popularTestsData,
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Question management ----------

async function adminQuestions(req, res, next) {
  try {
    const { q = '', subject = '', difficulty = '', topic = '' } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topic = topic;
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ text: re }, { tags: re }];
    }

    const [questions, subjects, topics, total] = await Promise.all([
      Question.find(filter).populate('subject', 'name slug').populate('topic', 'name slug').sort({ createdAt: -1 }).limit(200).lean(),
      Subject.find().sort('order').lean(),
      Topic.find().sort('order').lean(),
      Question.countDocuments(filter),
    ]);

    res.render('admin/questions', { title: 'Questions - Admin', questions, subjects, topics, total, filters: { q, subject, difficulty, topic } });
  } catch (err) {
    next(err);
  }
}

async function adminQuestionForm(req, res, next) {
  try {
    const { subjects, topics } = await loadSubjectsAndTopics();
    let question = null;
    if (req.params.id) {
      question = await Question.findById(req.params.id).populate('companies', 'name').lean();
      if (!question) return res.status(404).render('errors/404', { title: 'Question not found' });
    }
    res.render('admin/question-form', { title: question ? 'Edit Question' : 'New Question', subjects, topics, question });
  } catch (err) {
    next(err);
  }
}

function parseQuestionPayload(body) {
  const type = body.type || 'mcq';
  let correctOption = null;
  if (type === 'mcq' || type === 'sql') {
    correctOption = Number(body.correctOption);
    if (isNaN(correctOption) || correctOption < 0 || correctOption > 3) throw new Error('Select a correct option.');
  }
  return {
    text: (body.text || '').trim(),
    type,
    subject: body.subject,
    topic: body.topic,
    subtopic: (body.subtopic || '').trim(),
    options: ['a', 'b', 'c', 'd'].map((k) => (body[`option_${k}`] || '').trim()),
    correctOption,
    explanation: (body.explanation || '').trim(),
    difficulty: body.difficulty || 'medium',
    estimatedTime: Number(body.estimatedTime) || 60,
    tags: (body.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    companies: Array.isArray(body.companies) ? body.companies : [],
    isActive: body.isActive === 'on',
  };
}

async function adminQuestionCreate(req, res, next) {
  try {
    const data = parseQuestionPayload(req.body);
    if (!data.text) { req.flash('error', 'Question text is required.'); return res.redirect('/admin/questions/new'); }
    if (!data.subject || !data.topic) { req.flash('error', 'Subject and topic are required.'); return res.redirect('/admin/questions/new'); }
    if ((data.type === 'mcq' || data.type === 'sql') && data.options.some((o) => !o)) {
      req.flash('error', 'All four options are required.'); return res.redirect('/admin/questions/new');
    }
    data.companies = await resolveCompanyIds(req.body.companies);
    await Question.create({ ...data, createdBy: req.user._id });
    req.flash('success', 'Question created.');
    res.redirect('/admin/questions');
  } catch (err) {
    req.flash('error', err.message); res.redirect('/admin/questions/new');
  }
}

async function adminQuestionUpdate(req, res, next) {
  try {
    const data = parseQuestionPayload(req.body);
    if (!data.text) { req.flash('error', 'Question text is required.'); return res.redirect(`/admin/questions/${req.params.id}/edit`); }
    data.companies = await resolveCompanyIds(req.body.companies);
    await Question.updateOne({ _id: req.params.id }, data);
    req.flash('success', 'Question updated.');
    res.redirect('/admin/questions');
  } catch (err) {
    req.flash('error', err.message); res.redirect(`/admin/questions/${req.params.id}/edit`);
  }
}

async function adminQuestionDelete(req, res, next) {
  try {
    await Question.deleteOne({ _id: req.params.id });
    req.flash('success', 'Question deleted.');
  } catch (e) {
    req.flash('error', 'Could not delete question.');
  }
  res.redirect('/admin/questions');
}

async function adminQuestionToggle(req, res, next) {
  try {
    const q = await Question.findById(req.params.id);
    if (q) { q.isActive = !q.isActive; await q.save(); }
  } catch (e) {}
  res.redirect('/admin/questions');
}

// ---------- Bulk import ----------

function normalizeImportRow(row, index) {
  const errs = [];
  const text = (row.text || '').trim();
  const subjectName = (row.subject || '').trim();
  const topicName = (row.topic || '').trim();
  const difficulty = ['easy', 'medium', 'hard'].includes((row.difficulty || '').toLowerCase()) ? row.difficulty.toLowerCase() : 'medium';
  if (!text) errs.push(`Row ${index}: question text is required.`);
  if (!subjectName) errs.push(`Row ${index}: subject is required.`);

  let options = Array.isArray(row.options) ? row.options : String(row.options || '').split('|').map((s) => s.trim());
  if (options.length === 1 && options[0].includes(',')) options = options[0].split(',').map((s) => s.trim());
  options = options.slice(0, 4);
  if (options.length < 4) errs.push(`Row ${index}: exactly 4 options are required (got ${options.length}).`);

  let correctOption = null;
  const correctVal = String(row.correct == null ? row.correctOption : row.correct).trim().toUpperCase();
  if (/^[1-4]$/.test(correctVal)) correctOption = Number(correctVal) - 1;
  else if (/^[A-D]$/.test(correctVal)) correctOption = 'ABCD'.indexOf(correctVal);
  if (correctOption === null || correctOption < 0 || correctOption > 3) errs.push(`Row ${index}: correct answer must be 1-4 or A-D.`);

  const explanation = (row.explanation || '').trim();
  if (!explanation) errs.push(`Row ${index}: explanation is required.`);

  return { row: { text, subject: subjectName, topic: topicName, difficulty, options, correctOption, explanation, type: row.type === 'sql' ? 'sql' : 'mcq' }, errs };
}

async function adminImport(req, res, next) {
  try {
    const { subjects } = await loadSubjectsAndTopics();
    res.render('admin/import', { title: 'Bulk Import - Admin', subjects, preview: null, total: 0, validCount: 0, invalidCount: 0, fileId: null, importErrors: [] });
  } catch (err) {
    next(err);
  }
}

async function adminImportPreview(req, res, next) {
  try {
    const { subjects } = await loadSubjectsAndTopics();
    const file = req.file;
    if (!file) { req.flash('error', 'Upload a CSV or JSON file.'); return res.redirect('/admin/import'); }
    const raw = file.buffer.toString('utf8');
    let rows = [];
    try {
      if (file.mimetype.includes('json') || file.originalname.endsWith('.json')) {
        const parsed = JSON.parse(raw);
        rows = Array.isArray(parsed) ? parsed : parsed.questions || [];
      } else {
        rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
      }
    } catch (e) {
      req.flash('error', 'Could not parse file: ' + e.message);
      return res.redirect('/admin/import');
    }

    const normalized = rows.map((r, i) => normalizeImportRow(r, i + 2));
    const valid = normalized.filter((n) => !n.errs.length);
    const invalid = normalized.filter((n) => n.errs.length);

    req.session.importBatch = valid.map((v) => v.row);
    req.session.importErrors = invalid.flatMap((n) => n.errs);

    res.render('admin/import', {
      title: 'Bulk Import - Admin',
      subjects,
      preview: valid.slice(0, 25),
      total: rows.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      fileId: file.originalname,
      importErrors: req.session.importErrors || [],
    });
  } catch (err) {
    next(err);
  }
}

async function adminImportConfirm(req, res, next) {
  try {
    const batch = req.session.importBatch || [];
    if (!batch.length) { req.flash('error', 'Nothing to import.'); return res.redirect('/admin/import'); }

    const subjectMap = new Map((await Subject.find().lean()).map((s) => [s.name.toLowerCase(), s]));
    const topicMap = new Map((await Topic.find().populate('subject', 'name').lean()).map((t) => [`${t.subject.name.toLowerCase()}/${t.name.toLowerCase()}`, t]));

    let created = 0;
    const errors = [];
    for (const row of batch) {
      const subject = subjectMap.get(row.subject.toLowerCase());
      if (!subject) { errors.push(`Subject not found: ${row.subject}`); continue; }
      let topic = topicMap.get(`${row.subject.toLowerCase()}/${row.topic.toLowerCase()}`);
      if (!topic && row.topic) {
        topic = await Topic.create({ name: row.topic, slug: slugify(row.topic), subject: subject._id });
        topicMap.set(`${row.subject.toLowerCase()}/${row.topic.toLowerCase()}`, topic);
      }
      await Question.create({ ...row, subject: subject._id, topic: topic ? topic._id : null, createdBy: req.user._id });
      created += 1;
    }
    req.session.importBatch = null;
    req.session.importErrors = null;
    req.flash('success', `Imported ${created} questions.${errors.length ? ' Errors: ' + errors.join('; ') : ''}`);
    res.redirect('/admin/questions');
  } catch (err) {
    next(err);
  }
}

// ---------- Test management ----------

async function adminTests(req, res, next) {
  try {
    const tests = await Test.find().populate('company', 'name').populate('subject', 'name').sort({ createdAt: -1 }).lean();
    res.render('admin/tests', { title: 'Tests - Admin', tests });
  } catch (err) { next(err); }
}

async function adminTestForm(req, res, next) {
  try {
    const [subjects, topics, companies, questions] = await Promise.all([
      Subject.find().sort('order').lean(),
      Topic.find().sort('order').lean(),
      Company.find().sort('order').lean(),
      Question.find({ isActive: true }).populate('topic', 'name').populate('subject', 'name').sort({ createdAt: -1 }).lean(),
    ]);
    let test = null;
    if (req.params.id) {
      test = await Test.findById(req.params.id).populate('sections.questions', 'text difficulty topic subject').lean();
      if (!test) return res.status(404).render('errors/404', { title: 'Test not found' });
    }
    res.render('admin/test-form', { title: test ? 'Edit Test' : 'New Test', subjects, topics, companies, questions, test });
  } catch (err) { next(err); }
}

function parseTestPayload(body) {
  const sections = [];
  const names = Array.isArray(body.section_name) ? body.section_name : body.section_name ? [body.section_name] : [];
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || !names[i].trim()) continue;
    const qIds = (Array.isArray(body[`section_questions_${i}`]) ? body[`section_questions_${i}`] : body[`section_questions_${i}`] ? [body[`section_questions_${i}`]] : []).filter(Boolean);
    if (!qIds.length) continue;
    sections.push({
      name: names[i].trim(),
      order: i,
      questions: qIds,
      marksPerQuestion: Number(body[`section_marks_${i}`]) || 1,
      negativePerQuestion: Number(body[`section_negative_${i}`]) || 0,
    });
  }
  if (!sections.length) throw new Error('Add at least one section with questions.');

  return {
    title: (body.title || '').trim(),
    slug: body.slug ? slugify(body.slug) : slugify(body.title),
    description: (body.description || '').trim(),
    type: body.type || 'quick_quiz',
    subject: body.subject || null,
    topic: body.topic || null,
    company: body.company || null,
    durationMinutes: Number(body.durationMinutes) || 10,
    sections,
    negativeMarking: body.negativeMarking === 'on',
    randomization: body.randomization !== 'off',
    maxAttempts: Number(body.maxAttempts) || 0,
    isPublished: body.isPublished === 'on',
    featured: body.featured === 'on',
    instructions: (body.instructions || '').trim(),
  };
}

async function adminTestCreate(req, res, next) {
  try {
    const data = parseTestPayload(req.body);
    if (!data.title) { req.flash('error', 'Title is required.'); return res.redirect('/admin/tests/new'); }
    await Test.create({ ...data, createdBy: req.user._id });
    req.flash('success', 'Test created.');
    res.redirect('/admin/tests');
  } catch (err) {
    req.flash('error', err.message); res.redirect('/admin/tests/new');
  }
}

async function adminTestUpdate(req, res, next) {
  try {
    const data = parseTestPayload(req.body);
    await Test.updateOne({ _id: req.params.id }, data);
    req.flash('success', 'Test updated.');
    res.redirect('/admin/tests');
  } catch (err) {
    req.flash('error', err.message); res.redirect(`/admin/tests/${req.params.id}/edit`);
  }
}

async function adminTestDuplicate(req, res, next) {
  try {
    const t = await Test.findById(req.params.id);
    if (!t) return res.redirect('/admin/tests');
    const copy = t.toObject();
    delete copy._id;
    delete copy.createdAt;
    delete copy.updatedAt;
    copy.title = `${t.title} (Copy)`;
    copy.slug = `${t.slug}-copy-${Date.now()}`;
    copy.isPublished = false;
    await Test.create(copy);
    req.flash('success', 'Test duplicated.');
    res.redirect('/admin/tests');
  } catch (err) {
    req.flash('error', err.message); res.redirect('/admin/tests');
  }
}

async function adminTestDelete(req, res, next) {
  try {
    await Test.deleteOne({ _id: req.params.id });
    req.flash('success', 'Test deleted.');
  } catch (e) { req.flash('error', 'Could not delete test.'); }
  res.redirect('/admin/tests');
}

// ---------- Company management ----------

async function adminCompanies(req, res, next) {
  try {
    const companies = await Company.find().sort('order').lean();
    res.render('admin/companies', { title: 'Companies - Admin', companies });
  } catch (err) { next(err); }
}

async function adminCompanyForm(req, res, next) {
  let company = null;
  if (req.params.id) company = await Company.findById(req.params.id).lean();
  res.render('admin/company-form', { title: company ? 'Edit Company' : 'New Company', company });
}

function parseCompanyPayload(body) {
  return {
    name: (body.name || '').trim(),
    slug: slugify(body.slug || body.name),
    shortName: (body.shortName || '').trim(),
    description: (body.description || '').trim(),
    color: body.color || '#334155',
    tags: (body.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas : (body.focusAreas || '').split(',').map((s) => s.trim()).filter(Boolean),
    isActive: body.isActive === 'on',
    order: Number(body.order) || 0,
  };
}

async function adminCompanyCreate(req, res, next) {
  try {
    const data = parseCompanyPayload(req.body);
    if (!data.name) { req.flash('error', 'Name is required.'); return res.redirect('/admin/companies/new'); }
    await Company.create(data);
    req.flash('success', 'Company created.');
    res.redirect('/admin/companies');
  } catch (err) {
    req.flash('error', err.message); res.redirect('/admin/companies/new');
  }
}

async function adminCompanyUpdate(req, res, next) {
  try {
    const data = parseCompanyPayload(req.body);
    await Company.updateOne({ _id: req.params.id }, data);
    req.flash('success', 'Company updated.');
    res.redirect('/admin/companies');
  } catch (err) {
    req.flash('error', err.message); res.redirect(`/admin/companies/${req.params.id}/edit`);
  }
}

// ---------- Users ----------

async function adminUsers(req, res, next) {
  try {
    const { q = '', status = '' } = req.query;
    const filter = { role: 'student' };
    if (status === 'active') filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { college: new RegExp(q, 'i') }];

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(200).lean();
    const attemptCounts = await TestAttempt.aggregate([
      { $match: { user: { $in: users.map((u) => u._id) }, status: { $in: ['submitted', 'auto_submitted'] } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(attemptCounts.map((a) => [String(a._id), a.count]));

    res.render('admin/users', { title: 'Users - Admin', users, countMap, filters: { q, status } });
  } catch (err) { next(err); }
}

async function adminUserToggle(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (user && String(user._id) !== String(req.user._id)) {
      user.isActive = !user.isActive;
      await user.save();
    }
  } catch (e) {}
  res.redirect('/admin/users');
}

async function adminUserDetail(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).render('errors/404', { title: 'User not found' });
    const [attempts, questionsSolved] = await Promise.all([
      TestAttempt.find({ user: user._id, status: { $in: ['submitted', 'auto_submitted'] } }).populate('test', 'title slug').sort({ submittedAt: -1 }).limit(20).lean(),
      QuestionAttempt.countDocuments({ user: user._id }),
    ]);
    res.render('admin/user-detail', { title: `${user.name} - Admin`, user, attempts, questionsSolved });
  } catch (err) { next(err); }
}

// ---------- Coding problems ----------

async function adminCoding(req, res, next) {
  try {
    const problems = await CodingProblem.find().sort({ createdAt: -1 }).lean();
    res.render('admin/coding', { title: 'Coding Problems - Admin', problems });
  } catch (err) { next(err); }
}

async function adminCodingForm(req, res, next) {
  const companies = await Company.find().sort('order').lean();
  let problem = null;
  if (req.params.id) problem = await CodingProblem.findById(req.params.id).lean();
  res.render('admin/coding-form', { title: problem ? 'Edit Coding Problem' : 'New Coding Problem', companies, problem });
}

function parseCodingPayload(body) {
  const examples = [];
  const inputs = Array.isArray(body.example_input) ? body.example_input : body.example_input != null ? [body.example_input] : [];
  const outputs = Array.isArray(body.example_output) ? body.example_output : body.example_output != null ? [body.example_output] : [];
  const expls = Array.isArray(body.example_explanation) ? body.example_explanation : body.example_explanation != null ? [body.example_explanation] : [];
  const max = Math.max(inputs.length, outputs.length, expls.length);
  for (let i = 0; i < max; i++) {
    const input = (inputs[i] != null ? inputs[i] : '').trim();
    const output = (outputs[i] != null ? outputs[i] : '').trim();
    const explanation = (expls[i] != null ? expls[i] : '').trim();
    if (!input && !output && !explanation) continue;
    examples.push({ input, output, explanation });
  }
  return {
    title: (body.title || '').trim(),
    slug: slugify(body.slug || body.title),
    category: body.category || 'dsa',
    difficulty: body.difficulty || 'medium',
    problemStatement: (body.problemStatement || '').trim(),
    examples,
    constraints: (body.constraints || '').trim(),
    tags: (body.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    concepts: (body.concepts || '').split(',').map((c) => c.trim()).filter(Boolean),
    explanation: (body.explanation || '').trim(),
    solution: (body.solution || '').trim(),
    companies: Array.isArray(body.companies) ? body.companies : [],
    isActive: body.isActive === 'on',
  };
}

async function adminCodingCreate(req, res, next) {
  try {
    const data = parseCodingPayload(req.body);
    if (!data.title || !data.problemStatement) { req.flash('error', 'Title and problem statement are required.'); return res.redirect('/admin/coding/new'); }
    await CodingProblem.create({ ...data, createdBy: req.user._id });
    req.flash('success', 'Coding problem created.');
    res.redirect('/admin/coding');
  } catch (err) {
    req.flash('error', err.message); res.redirect('/admin/coding/new');
  }
}

async function adminCodingUpdate(req, res, next) {
  try {
    const data = parseCodingPayload(req.body);
    await CodingProblem.updateOne({ _id: req.params.id }, data);
    req.flash('success', 'Coding problem updated.');
    res.redirect('/admin/coding');
  } catch (err) {
    req.flash('error', err.message); res.redirect(`/admin/coding/${req.params.id}/edit`);
  }
}

async function adminCodingDelete(req, res, next) {
  try {
    await CodingProblem.deleteOne({ _id: req.params.id });
    req.flash('success', 'Coding problem deleted.');
  } catch (e) { req.flash('error', 'Could not delete.'); }
  res.redirect('/admin/coding');
}

// ---------- Daily challenge ----------

async function adminDaily(req, res, next) {
  try {
    const challenges = await DailyChallenge.find().sort({ date: -1 }).limit(14).populate('questions', 'text').lean();
    res.render('admin/daily', { title: 'Daily Challenge - Admin', challenges, today: new Date().toISOString().slice(0, 10) });
  } catch (err) { next(err); }
}

async function adminDailyCreate(req, res, next) {
  try {
    const { date, title, description, questions } = req.body;
    if (!date) { req.flash('error', 'Date is required.'); return res.redirect('/admin/daily'); }
    const qIds = Array.isArray(questions)
      ? questions
      : String(questions || '').split(',').map((s) => s.trim()).filter(Boolean);
    await DailyChallenge.findOneAndUpdate(
      { date },
      { title: title || `Daily Placement Challenge - ${date}`, description: description || '', questions: qIds, isActive: true },
      { upsert: true, new: true }
    );
    req.flash('success', 'Daily challenge saved.');
    res.redirect('/admin/daily');
  } catch (err) { next(err); }
}

module.exports = {
  adminDashboard,
  adminQuestions,
  adminQuestionForm,
  adminQuestionCreate,
  adminQuestionUpdate,
  adminQuestionDelete,
  adminQuestionToggle,
  adminImport,
  adminImportPreview,
  adminImportConfirm,
  adminTests,
  adminTestForm,
  adminTestCreate,
  adminTestUpdate,
  adminTestDuplicate,
  adminTestDelete,
  adminCompanies,
  adminCompanyForm,
  adminCompanyCreate,
  adminCompanyUpdate,
  adminUsers,
  adminUserToggle,
  adminUserDetail,
  adminCoding,
  adminCodingForm,
  adminCodingCreate,
  adminCodingUpdate,
  adminCodingDelete,
  adminDaily,
  adminDailyCreate,
};
