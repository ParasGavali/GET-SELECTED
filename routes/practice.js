const router = require('express').Router();
const { practiceSetup, startSession, submitPractice } = require('../controllers/practiceController');
const { requireAuth } = require('../middleware/auth');

router.get('/practice', practiceSetup);
router.get('/practice/session', requireAuth, startSession);
router.post('/api/practice/submit', requireAuth, submitPractice);

module.exports = router;
