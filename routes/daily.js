const router = require('express').Router();
const { dailyPage, submitDaily } = require('../controllers/dailyController');
const { requireAuth } = require('../middleware/auth');

router.get('/daily', requireAuth, dailyPage);
router.post('/api/daily/submit', requireAuth, submitDaily);

module.exports = router;
