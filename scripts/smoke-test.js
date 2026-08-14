/* Smoke test: boots the app with an in-memory MongoDB, seeds, and exercises key flows. */
process.env.NODE_ENV = 'test';
process.env.PORT = '5999';
process.env.SESSION_SECRET = 'smoke-test-secret';

const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('getselected');

  const { seed } = require('../seed/seed.js');
  await seed({ disconnect: false });

  const Question = require('../models/Question');
  const Test = require('../models/Test');
  const TestAttempt = require('../models/TestAttempt');
  const DailyChallenge = require('../models/DailyChallenge');
  const CodingProblem = require('../models/CodingProblem');

  require('../server.js');

  const base = 'http://localhost:5999';
  let cookie = '';

  async function req(method, path, body, headers) {
    const res = await fetch(base + path, {
      method,
      headers: {
        cookie,
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const sc = setCookie.split(';')[0];
      cookie = cookie ? cookie + '; ' + sc : sc;
    }
    return res;
  }

  const check = (name, ok, extra) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' :: ' + extra : ''}`);
    if (!ok) process.exitCode = 1;
  };

  // Public pages
  const pages = [
    ['/healthz', 200],
    ['/', 200],
    ['/about', 200],
    ['/search', 200],
    ['/login', 200],
    ['/signup', 200],
  ];
  for (const [p, code] of pages) {
    const r = await req('GET', p);
    check(`GET ${p}`, r.status === code, `got ${r.status}`);
  }

  // Auth flow
  let r = await req('POST', '/signup', { name: 'Test Student', email: 'student@test.in', password: 'Passw0rd!', confirmPassword: 'Passw0rd!' });
  check('signup student', r.status === 302, `got ${r.status} ${r.headers.get('location')}`);
  r = await req('GET', '/dashboard');
  check('dashboard after signup', r.status === 200, `got ${r.status}`);

  // Student pages
  const studentPages = ['/practice', '/tests', '/companies', '/coding', '/daily', '/leaderboard', '/analytics', '/ai-analysis', '/saved', '/profile', '/tests/history'];
  for (const p of studentPages) {
    const res = await req('GET', p);
    check(`GET ${p}`, res.status === 200, `got ${res.status}`);
  }

  // Practice flow
  r = await req('GET', '/practice/session?count=5');
  check('practice session page', r.status === 200, `got ${r.status}`);
  const sample = await Question.findOne({ isActive: true }).lean();
  r = await req('POST', '/api/practice/submit', { answers: [{ question: String(sample._id), selected: sample.correctOption, timeSpent: 5 }] });
  const pd = await r.json().catch(() => ({}));
  check('practice submit', r.status === 200 && typeof pd.total === 'number', `got ${r.status}`);

  // Test flow
  const aTest = await Test.findOne({ isPublished: true }).lean();
  r = await req('GET', `/tests/${aTest.slug}`);
  check('test detail', r.status === 200, `got ${r.status}`);
  r = await req('POST', `/tests/${String(aTest._id)}/start`, {});
  let body = await r.text();
  check('test start (interface)', r.status === 200, `got ${r.status}`);
  const am = body.match(/var attemptId = "([0-9a-f]+)"/);
  if (am) {
    const attemptId = am[1];
    const attempt = await TestAttempt.findById(attemptId).lean();
    const answers = (attempt.answers || []).map((a, i) => ({ question: String(a.question), selected: i === 0 ? 0 : null }));
    r = await req('POST', `/tests/${attemptId}/submit`, { answers, timeTaken: 30 });
    const td = await r.json().catch(() => ({}));
    check('test submit', r.status === 200 && td.ok, `got ${r.status} ${JSON.stringify(td)}`);
    if (td.resultUrl) {
      r = await req('GET', td.resultUrl);
      check('test result page', r.status === 200, `got ${r.status}`);
    }
  } else {
    check('attemptId found', false, 'not in rendered interface');
  }

  // Daily challenge submit
  const ch = await DailyChallenge.findOne({}).lean();
  if (ch) {
    const questions = await Question.find({ _id: { $in: ch.questions } }).lean();
    const answers = {};
    questions.forEach((q, i) => { answers[String(q._id)] = i === 0 ? q.correctOption : null; });
    r = await req('POST', '/api/daily/submit', { answers, timeTaken: 30 });
    const dd = await r.json().catch(() => ({}));
    check('daily submit', r.status === 200 && dd.ok, `got ${r.status} ${JSON.stringify(dd)}`);
    r = await req('GET', '/daily');
    check('daily result page', r.status === 200, `got ${r.status}`);
  }

  // Coding flow
  const prob = await CodingProblem.findOne({ isActive: true }).lean();
  r = await req('GET', `/coding/${prob.slug}`);
  check('coding problem detail', r.status === 200, `got ${r.status}`);
  r = await req('POST', `/coding/${prob.slug}/submit`, { language: 'javascript', code: '// solution' });
  const cd = await r.json().catch(() => ({}));
  check('coding submit', r.status === 200 && cd.ok, `got ${r.status} ${JSON.stringify(cd)}`);
  r = await req('GET', '/coding/my-attempts');
  check('my-attempts', r.status === 200, `got ${r.status}`);

  // Admin flow
  cookie = ''; // start a fresh session as admin
  r = await req('POST', '/login', { email: 'admin@getselected.in', password: 'Admin@12345' });
  check('admin login', r.status === 302, `got ${r.status} ${r.headers.get('location')}`);
  const adminPages = ['/admin', '/admin/questions', '/admin/tests', '/admin/companies', '/admin/coding', '/admin/users', '/admin/daily', '/admin/import', '/admin/questions/new', '/admin/tests/new', '/admin/companies/new', '/admin/coding/new'];
  for (const p of adminPages) {
    const res = await req('GET', p);
    check(`GET ${p}`, res.status === 200, `got ${res.status}`);
  }

  await mongod.stop();
  console.log('Smoke test finished.');
  if (process.exitCode) {
    console.log('Some checks failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('SMOKE TEST ERROR:', err);
  process.exit(1);
});
