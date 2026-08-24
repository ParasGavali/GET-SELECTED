require('dotenv').config();
const mongoose = require('mongoose');

const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Company = require('../models/Company');
const CodingProblem = require('../models/CodingProblem');
const User = require('../models/User');
const College = require('../models/College');
const TestAttempt = require('../models/TestAttempt');

const { subjects } = require('./data/subjects');
const { aptitude } = require('./data/aptitude');
const { reasoning } = require('./data/reasoning');
const { verbal } = require('./data/verbal');
const { technical } = require('./data/technical');
const { sql } = require('./data/sql');
const { coding } = require('./data/coding');
const { companies } = require('./data/companies');
const { colleges } = require('./data/colleges');

const collections = {
  Subject,
  Topic,
  Question,
  Test,
  Company,
  CodingProblem,
  User,
  College,
  TestAttempt,
};

async function seed({ reset: resetFlag, disconnect: shouldDisconnect } = {}) {
  const reset = resetFlag !== undefined ? resetFlag : process.argv.includes('--reset');
  const disconnect = shouldDisconnect !== undefined ? shouldDisconnect : true;
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is required to seed.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('[seed] Connected to MongoDB');

  if (reset) {
    for (const [name, model] of Object.entries(collections)) {
      await model.deleteMany({});
      console.log(`[seed] Cleared ${name}`);
    }
  }

  // ---- Subjects & Topics ----
  const subjectMap = new Map();
  const topicMap = new Map();

  for (const s of subjects) {
    const subject = await Subject.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
    subjectMap.set(s.code, subject);
    for (const t of s.topics) {
      const topic = await Topic.findOneAndUpdate({ subject: subject._id, slug: t.slug }, { ...t, subject: subject._id }, { upsert: true, new: true });
      topicMap.set(t.slug, topic);
    }
  }
  console.log(`[seed] Subjects: ${subjectMap.size}, Topics: ${topicMap.size}`);

  // ---- Companies ----
  const companyMap = new Map();
  for (const c of companies) {
    const company = await Company.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    companyMap.set(c.slug, company);
  }
  console.log(`[seed] Companies: ${companyMap.size}`);

  // ---- Colleges ----
  let collegeCount = 0;
  for (const c of colleges) {
    await College.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    collegeCount += 1;
  }
  console.log(`[seed] Colleges: ${collegeCount}`);

  // ---- Questions ----
  const allQ = [
    ...aptitude.map((q) => ({ ...q, subject: 'APT' })),
    ...reasoning.map((q) => ({ ...q, subject: 'LOGICAL' })),
    ...verbal.map((q) => ({ ...q, subject: 'VERBAL' })),
    ...technical.map((q) => ({ ...q, subject: 'TECHNICAL' })),
    ...sql.map((q) => ({ ...q, subject: 'SQL' })),
  ];

  let qCount = 0;
  for (const q of allQ) {
    const subject = subjectMap.get(q.subject);
    const topic = topicMap.get(q.topic);
    if (!subject || !topic) {
      console.warn(`[seed] Skipping question (missing subject/topic): ${q.text.slice(0, 50)}`);
      continue;
    }
    const doc = {
      text: q.text,
      type: q.type || 'mcq',
      subject: subject._id,
      topic: topic._id,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
      difficulty: q.difficulty,
      estimatedTime: q.estimatedTime,
      isActive: true,
      source: 'get-selected',
    };
    await Question.findOneAndUpdate({ text: q.text, subject: subject._id }, doc, { upsert: true, new: true });
    qCount += 1;
  }
  console.log(`[seed] Questions: ${qCount}`);

  // ---- Coding problems ----
  let cCount = 0;
  for (const c of coding) {
    await CodingProblem.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    cCount += 1;
  }
  console.log(`[seed] Coding problems: ${cCount}`);

  // ---- Tests ----
  const byTopic = async (slug) => (await Question.find({ topic: topicMap.get(slug)._id, isActive: true }).select('_id')).map((q) => q._id);
  const bySubject = async (code) => (await Question.find({ subject: subjectMap.get(code)._id, isActive: true }).select('_id')).map((q) => q._id);

  const pick = (arr, n) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  };

  const [aptAll, reasonAll, verbalAll, techAll, sqlAll] = await Promise.all([
    bySubject('APT'),
    bySubject('LOGICAL'),
    bySubject('VERBAL'),
    bySubject('TECHNICAL'),
    bySubject('SQL'),
  ]);
  const prob = await byTopic('probability');

  const tests = [
    {
      title: 'Quick Aptitude Quiz',
      slug: 'quick-aptitude-quiz',
      description: 'A fast 10-question aptitude warm-up. Great for daily practice.',
      type: 'quick_quiz',
      subject: subjectMap.get('APT')._id,
      durationMinutes: 10,
      featured: true,
      negativeMarking: false,
      randomization: true,
      sections: [{ name: 'Aptitude', questions: pick(aptAll, 10), marksPerQuestion: 1, negativePerQuestion: 0 }],
    },
    {
      title: 'Probability Topic Test',
      slug: 'probability-topic-test',
      description: 'Focused practice on probability concepts for placement tests.',
      type: 'topic',
      subject: subjectMap.get('APT')._id,
      topic: topicMap.get('probability')._id,
      durationMinutes: 15,
      negativeMarking: false,
      randomization: true,
      sections: [{ name: 'Probability', questions: pick(prob, Math.min(prob.length, 10)), marksPerQuestion: 1, negativePerQuestion: 0 }],
    },
    {
      title: 'Quant Sectional Test',
      slug: 'quant-sectional-test',
      description: 'A sectional test covering the full quantitative aptitude syllabus.',
      type: 'sectional',
      subject: subjectMap.get('APT')._id,
      durationMinutes: 30,
      negativeMarking: true,
      randomization: true,
      sections: [{ name: 'Quantitative Aptitude', questions: pick(aptAll, 20), marksPerQuestion: 1, negativePerQuestion: 0.25 }],
    },
    {
      title: 'Technical Fundamentals Test',
      slug: 'technical-fundamentals-test',
      description: 'Core computer science subjects: DBMS, OS, Networks, OOP and DSA basics.',
      type: 'topic',
      subject: subjectMap.get('TECHNICAL')._id,
      durationMinutes: 20,
      negativeMarking: false,
      randomization: true,
      sections: [{ name: 'Technical', questions: pick(techAll, 15), marksPerQuestion: 1, negativePerQuestion: 0 }],
    },
    {
      title: 'SQL Basics Test',
      slug: 'sql-basics-test',
      description: 'Test your knowledge of core SQL: SELECT, JOINs, GROUP BY and subqueries.',
      type: 'topic',
      subject: subjectMap.get('SQL')._id,
      durationMinutes: 15,
      negativeMarking: false,
      randomization: true,
      sections: [{ name: 'SQL', questions: pick(sqlAll, 12), marksPerQuestion: 1, negativePerQuestion: 0 }],
    },
    {
      title: 'Full Mock Test - Engineering Placement',
      slug: 'full-mock-engineering-placement',
      description: 'A complete placement-style mock: Aptitude, Reasoning, Verbal and Technical.',
      type: 'mock',
      durationMinutes: 60,
      featured: true,
      negativeMarking: true,
      randomization: true,
      sections: [
        { name: 'Aptitude', questions: pick(aptAll, 15), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Reasoning', questions: pick(reasonAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Verbal', questions: pick(verbalAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Technical', questions: pick(techAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
      ],
    },
    {
      title: 'TCS Style Full Mock',
      slug: 'tcs-style-full-mock',
      description: 'A practice mock modelled on the sections typically seen in TCS hiring tests: Quant, Reasoning, Verbal, Technical and Coding MCQs.',
      type: 'company_mock',
      company: companyMap.get('tcs')._id,
      durationMinutes: 60,
      negativeMarking: true,
      randomization: true,
      sections: [
        { name: 'Aptitude', questions: pick(aptAll, 12), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Reasoning', questions: pick(reasonAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Verbal', questions: pick(verbalAll, 8), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Technical', questions: pick(techAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
      ],
    },
    {
      title: 'Infosys Style Full Mock',
      slug: 'infosys-style-full-mock',
      description: 'A practice mock covering the quantitative, logical, verbal and technical sections typical of Infosys hiring tests.',
      type: 'company_mock',
      company: companyMap.get('infosys')._id,
      durationMinutes: 55,
      negativeMarking: true,
      randomization: true,
      sections: [
        { name: 'Aptitude', questions: pick(aptAll, 12), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Reasoning', questions: pick(reasonAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Verbal', questions: pick(verbalAll, 8), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Technical', questions: pick(techAll, 10), marksPerQuestion: 1, negativePerQuestion: 0.25 },
      ],
    },
    {
      title: 'Amazon DSA Basics',
      slug: 'amazon-dsa-basics',
      description: 'A technical mock focused on data structures, algorithms and computer fundamentals for software roles.',
      type: 'company_mock',
      company: companyMap.get('amazon')._id,
      durationMinutes: 25,
      negativeMarking: false,
      randomization: true,
      sections: [{ name: 'Technical', questions: pick(techAll, 15), marksPerQuestion: 1, negativePerQuestion: 0 }],
    },
    {
      title: 'Weekly Contest - Mixed',
      slug: 'weekly-contest-mixed',
      description: 'A competitive mixed practice contest across all subjects. Everything is free.',
      type: 'contest',
      durationMinutes: 40,
      featured: true,
      negativeMarking: true,
      randomization: true,
      sections: [
        { name: 'Aptitude', questions: pick(aptAll, 8), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Reasoning', questions: pick(reasonAll, 8), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Verbal', questions: pick(verbalAll, 6), marksPerQuestion: 1, negativePerQuestion: 0.25 },
        { name: 'Technical', questions: pick(techAll, 6), marksPerQuestion: 1, negativePerQuestion: 0.25 },
      ],
    },
  ];

  let tCount = 0;
  for (const t of tests) {
    await Test.findOneAndUpdate({ slug: t.slug }, t, { upsert: true, new: true });
    tCount += 1;
  }
  console.log(`[seed] Tests: ${tCount}`);

  // ---- Admin user ----
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@getselected.in').toLowerCase();
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: adminName, email: adminEmail, password: adminPassword, role: 'admin', college: 'GET SELECTED' });
    console.log(`[seed] Admin created: ${adminEmail}`);
  } else {
    console.log(`[seed] Admin already exists: ${adminEmail}`);
  }

  console.log('[seed] Seeding complete.');
  console.log('      Admin login:', adminEmail, '/', adminPassword);
  if (disconnect) await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  });
}

module.exports = { seed };
