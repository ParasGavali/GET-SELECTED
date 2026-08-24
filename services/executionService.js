const https = require('https');
const http = require('http');

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || '';

const LANG_IDS = {
  javascript: 53,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (JUDGE0_AUTH_TOKEN) h['X-Auth-Token'] = JUDGE0_AUTH_TOKEN;
  return h;
}

async function executeCode(language, code, stdin = '', timeLimit = 5) {
  const langId = LANG_IDS[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  const payload = {
    language_id: langId,
    source_code: Buffer.from(code).toString('base64'),
    stdin: Buffer.from(stdin).toString('base64'),
    cpu_time_limit: timeLimit,
    wall_time_limit: timeLimit * 2,
    memory_limit: 256 * 1024,
  };

  const url = `${JUDGE0_URL}/api/submissions?base64_encoded=true&wait=true`;
  const { status, data } = await request(url, { method: 'POST', headers: getHeaders() }, JSON.stringify(payload));

  if (status !== 201 && status !== 200) {
    throw new Error(`Judge0 returned ${status}: ${JSON.stringify(data)}`);
  }

  const result = {
    stdout: data.stdout ? Buffer.from(data.stdout, 'base64').toString() : '',
    stderr: data.stderr ? Buffer.from(data.stderr, 'base64').toString() : '',
    compile_output: data.compile_output ? Buffer.from(data.compile_output, 'base64').toString() : '',
    status: data.status,
    time: data.time,
    memory: data.memory,
  };

  return result;
}

async function runTestCases(language, code, testCases, timeLimit = 5) {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const result = await executeCode(language, code, tc.input, timeLimit);

      const passed = normalizeOutput(result.stdout) === normalizeOutput(tc.output);
      results.push({
        index: i,
        input: tc.input,
        expected: tc.output,
        actual: result.stdout.trim(),
        passed,
        status: result.status?.description || 'Unknown',
        time: result.time,
        memory: result.memory,
        stderr: result.stderr,
        compile_output: result.compile_output,
      });
    } catch (err) {
      results.push({
        index: i,
        input: tc.input,
        expected: tc.output,
        actual: '',
        passed: false,
        status: 'Error',
        time: 0,
        memory: 0,
        stderr: err.message,
        compile_output: '',
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    results,
  };
}

function normalizeOutput(str) {
  return (str || '').trim().replace(/\r\n/g, '\n').replace(/\s+$/gm, '');
}

function getLanguageId(language) {
  return LANG_IDS[language] || null;
}

function isConfigured() {
  return !!JUDGE0_URL;
}

module.exports = { executeCode, runTestCases, getLanguageId, isConfigured, LANG_IDS };
