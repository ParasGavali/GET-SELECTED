require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');

const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Company = require('../models/Company');

const POSITION_TAGS = [
  'Software Engineer',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'AI/ML Engineer',
  'QA/Test Engineer',
];

const DIFFICULTY_MAP = {
  easy: 'easy', medium: 'medium', hard: 'hard',
  Easy: 'easy', Medium: 'medium', Hard: 'hard',
  EASY: 'easy', MEDIUM: 'medium', HARD: 'hard',
};

const CODING_SUBJECT_MAP = { coding: 'dsa', technical: 'dsa', sql: 'sql' };

const CSV_PATH = path.join(__dirname, '..', 'questions_final.csv');
const BATCH_SIZE = 500;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function parseCodingTitle(text) {
  return (text.split('\n').map((l) => l.trim()).filter(Boolean)[0] || text.slice(0, 120));
}

async function seedQuestions() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is required.'); process.exit(1); }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('[seed-questions] Connected to MongoDB');

  const subjects = await Subject.find({}).lean();
  const subjectMap = new Map();
  for (const s of subjects) {
    subjectMap.set(s.name.toLowerCase(), s);
    if (s.code) subjectMap.set(s.code.toLowerCase(), s);
    if (s.slug) subjectMap.set(s.slug.toLowerCase(), s);
  }

  const topics = await Topic.find({}).lean();
  const topicMap = new Map();
  for (const t of topics) {
    topicMap.set(t.name.toLowerCase(), t);
    if (t.slug) topicMap.set(t.slug.toLowerCase(), t);
  }

  const companies = await Company.find({}).lean();
  const companyMap = new Map();
  for (const c of companies) {
    companyMap.set(c.name.toLowerCase(), c);
    if (c.slug) companyMap.set(c.slug.toLowerCase(), c);
  }

  console.log(`[seed-questions] Loaded ${subjectMap.size} subjects, ${topicMap.size} topics, ${companyMap.size} companies`);

  const existingCodingSlugs = new Set((await CodingProblem.distinct('slug')));
  console.log(`[seed-questions] ${existingCodingSlugs.size} existing coding problems in DB`);

  const existingQuestions = await Question.distinct('text');
  const existingQuestionTexts = new Set(existingQuestions);
  console.log(`[seed-questions] ${existingQuestionTexts.size} existing questions in DB`);

  if (!fs.existsSync(CSV_PATH)) { console.error(`[seed-questions] CSV not found at ${CSV_PATH}`); process.exit(1); }

  const records = [];
  const parser = fs.createReadStream(CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true, relax_column_count: true, relax_quotes: true })
  );
  for await (const record of parser) { records.push(record); }
  console.log(`[seed-questions] Parsed ${records.length} records from CSV`);

  const skipReasons = {};
  const seenSlugs = new Set();
  const seenTexts = new Set();
  const mcqDocs = [];
  const codingDocs = [];
  let mcqSkipped = 0, codingSkipped = 0;

  function skip(reason) { skipReasons[reason] = (skipReasons[reason] || 0) + 1; }

  function mapCompanyIds(companyTags) {
    return (companyTags || '').split('|').map((c) => c.trim()).filter(Boolean).reduce((ids, name) => {
      const comp = companyMap.get(name.toLowerCase());
      if (comp) ids.push(comp._id);
      return ids;
    }, []);
  }

  function mapPositionTags(raw) {
    return (raw || '').split('|').map((p) => p.trim()).filter((p) => POSITION_TAGS.includes(p));
  }

  function resolveSubject(subjectName) {
    let s = subjectMap.get(subjectName.toLowerCase());
    if (!s) s = subjectMap.get(subjectName.toLowerCase().replace(/\s+/g, '-'));
    if (!s) {
      for (const [key, val] of subjectMap) {
        if (subjectName.toLowerCase().includes(key) || key.includes(subjectName.toLowerCase())) { s = val; break; }
      }
    }
    return s;
  }

  function resolveTopic(topicName, subject) {
    if (!topicName) return null;

    let t = topicMap.get(topicName.toLowerCase());

    if (!t) {
      for (const [key, val] of topicMap) {
        if (val.subject && String(val.subject) === String(subject._id)) {
          if (topicName.toLowerCase().includes(key) || key.includes(topicName.toLowerCase())) { t = val; break; }
        }
      }
    }

    if (!t) {
      for (const [key, val] of topicMap) {
        if (topicName.toLowerCase().includes(key) || key.includes(topicName.toLowerCase())) { t = val; break; }
      }
    }

    if (!t) {
      t = topics.find((x) => x.subject && String(x.subject) === String(subject._id) && x.slug === 'general') || null;
    }

    return t;
  }

  for (const rec of records) {
    try {
      const text = (rec.question_text || '').trim();
      if (!text) { skip('empty_text'); continue; }

      const type = (rec.question_type || '').trim().toLowerCase();

      if (type === 'coding') {
        const title = parseCodingTitle(text);
        const slug = slugify(title);
        if (!slug) { codingSkipped++; skip('coding_no_slug'); continue; }
        if (existingCodingSlugs.has(slug) || seenSlugs.has(slug)) { codingSkipped++; skip('coding_duplicate'); continue; }
        seenSlugs.add(slug);

        codingDocs.push({
          title, slug,
          category: CODING_SUBJECT_MAP[(rec.subject || '').trim().toLowerCase()] || 'dsa',
          difficulty: DIFFICULTY_MAP[(rec.difficulty || '').trim()] || 'medium',
          problemStatement: text,
          tags: (rec.skills || '').split('|').map((s) => s.trim()).filter(Boolean),
          explanation: (rec.explanation || '').trim(),
          companies: mapCompanyIds(rec.company_tags),
          positionTags: mapPositionTags(rec.position_tags),
          isActive: true,
        });
        continue;
      }

      const questionType = type === 'sql' ? 'sql' : 'mcq';
      const optionA = (rec.option_a || '').trim();
      const optionB = (rec.option_b || '').trim();
      const optionC = (rec.option_c || '').trim();
      const optionD = (rec.option_d || '').trim();

      if (!optionA || !optionB || !optionC || !optionD) { mcqSkipped++; skip('missing_options'); continue; }
      const correctAnswer = (rec.correct_answer || '').trim().toUpperCase();
      const correctOption = { A: 0, B: 1, C: 2, D: 3 }[correctAnswer];
      if (correctOption === undefined) { mcqSkipped++; skip('bad_correct_answer'); continue; }

      const subject = resolveSubject((rec.subject || '').trim());
      if (!subject) { mcqSkipped++; skip('no_subject: ' + (rec.subject || '').trim()); continue; }
      const topic = resolveTopic((rec.topic || '').trim(), subject);
      if (!topic) { mcqSkipped++; skip('no_topic: ' + (rec.subject || '').trim() + ' > ' + (rec.topic || '').trim()); continue; }

      const dedupKey = text.toLowerCase() + '|' + subject._id + '|' + topic._id;
      if (seenTexts.has(dedupKey)) { mcqSkipped++; skip('mcq_dedup'); continue; }
      seenTexts.add(dedupKey);
      if (existingQuestionTexts.has(text)) { mcqSkipped++; skip('mcq_in_db'); continue; }

      mcqDocs.push({
        text, type: questionType,
        subject: subject._id, topic: topic._id,
        subtopic: (rec.subtopic || '').trim(),
        options: [optionA, optionB, optionC, optionD],
        correctOption,
        explanation: (rec.explanation || '').trim(),
        difficulty: DIFFICULTY_MAP[(rec.difficulty || '').trim()] || 'medium',
        estimatedTime: 60,
        tags: (rec.skills || '').split('|').map((s) => s.trim()).filter(Boolean),
        companies: mapCompanyIds(rec.company_tags),
        positionTags: mapPositionTags(rec.position_tags),
        source: 'csv-import',
        sourceName: (rec.source_file || '').trim(),
        isActive: true, status: 'published',
      });
    } catch (err) {
      skip('error: ' + err.message);
    }
  }

  console.log(`[seed-questions] Prepared ${codingDocs.length} coding + ${mcqDocs.length} MCQ docs`);

  let codingInserted = 0, mcqInserted = 0;
  let codingErrors = 0, mcqErrors = 0;

  for (let i = 0; i < codingDocs.length; i += BATCH_SIZE) {
    const batch = codingDocs.slice(i, i + BATCH_SIZE);
    try {
      const result = await CodingProblem.insertMany(batch, { ordered: false });
      codingInserted += result.length;
    } catch (err) {
      if (err.insertedDocs) codingInserted += err.insertedDocs.length;
      codingErrors += (batch.length - (err.insertedDocs ? err.insertedDocs.length : 0));
    }
    if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= codingDocs.length) {
      console.log(`[seed-questions] Coding batch ${Math.min(i + BATCH_SIZE, codingDocs.length)}/${codingDocs.length} done`);
    }
  }

  for (let i = 0; i < mcqDocs.length; i += BATCH_SIZE) {
    const batch = mcqDocs.slice(i, i + BATCH_SIZE);
    try {
      const result = await Question.insertMany(batch, { ordered: false });
      mcqInserted += result.length;
    } catch (err) {
      if (err.insertedDocs) mcqInserted += err.insertedDocs.length;
      mcqErrors += (batch.length - (err.insertedDocs ? err.insertedDocs.length : 0));
    }
    if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= mcqDocs.length) {
      console.log(`[seed-questions] MCQ batch ${Math.min(i + BATCH_SIZE, mcqDocs.length)}/${mcqDocs.length} done`);
    }
  }

  console.log('\n[seed-questions] === IMPORT REPORT ===');
  console.log(`  Total CSV rows:       ${records.length}`);
  console.log(`  Coding prepared:      ${codingDocs.length}`);
  console.log(`  Coding inserted:      ${codingInserted}`);
  console.log(`  Coding errors:        ${codingErrors}`);
  console.log(`  MCQ prepared:         ${mcqDocs.length}`);
  console.log(`  MCQ inserted:         ${mcqInserted}`);
  console.log(`  MCQ errors:           ${mcqErrors}`);
  console.log(`  MCQ skipped:          ${mcqSkipped}`);
  console.log(`  Coding skipped:       ${codingSkipped}`);
  console.log('\n--- Skip reasons ---');
  const sorted = Object.entries(skipReasons).sort((a, b) => b[1] - a[1]);
  for (const [reason, count] of sorted) {
    console.log(`  ${String(count).padStart(6)}  ${reason}`);
  }
  console.log('========================\n');

  await mongoose.disconnect();
  console.log('[seed-questions] Done.');
}

if (require.main === module) {
  seedQuestions().catch((err) => { console.error('[seed-questions] Fatal:', err.message); process.exit(1); });
}

module.exports = { seedQuestions };
