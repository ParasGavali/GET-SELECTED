const router = require('express').Router();
const { listProblems, problemDetail, runCode, submitCode, myAttempts, codeLimiter } = require('../controllers/codingController');
const { requireAuth } = require('../middleware/auth');

router.get('/coding', listProblems);
router.get('/coding/my-attempts', requireAuth, myAttempts);
router.get('/coding/:slug', problemDetail);
router.post('/coding/:slug/run', requireAuth, codeLimiter, runCode);
router.post('/coding/:slug/submit', requireAuth, codeLimiter, submitCode);

module.exports = router;
