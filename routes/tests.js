const router = require('express').Router();
const {
  listTests,
  testDetail,
  startTest,
  submitTest,
  testResult,
  testHistory,
  resumeAttempt,
  testStats,
} = require('../controllers/testController');
const { requireAuth } = require('../middleware/auth');

router.get('/tests', listTests);
router.get('/tests/history', requireAuth, testHistory);
router.get('/tests/:slug', testDetail);
router.post('/tests/:id/start', requireAuth, startTest);
router.post('/tests/:id/submit', requireAuth, submitTest);
router.get('/tests/:slug/result/:attemptId', requireAuth, testResult);
router.get('/api/tests/:slug/stats', testStats);
router.get('/api/attempts/:id/resume', requireAuth, resumeAttempt);

module.exports = router;
