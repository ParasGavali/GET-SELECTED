const router = require('express').Router();
const { listProblems, problemDetail, submitCode, myAttempts } = require('../controllers/codingController');
const { requireAuth } = require('../middleware/auth');

router.get('/coding', listProblems);
router.get('/coding/my-attempts', requireAuth, myAttempts);
router.get('/coding/:slug', problemDetail);
router.post('/coding/:slug/submit', requireAuth, submitCode);

module.exports = router;
