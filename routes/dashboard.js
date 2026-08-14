const router = require('express').Router();
const { dashboard, analytics, aiAnalysisPage } = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

router.get('/dashboard', requireAuth, dashboard);
router.get('/analytics', requireAuth, analytics);
router.get('/ai-analysis', requireAuth, aiAnalysisPage);

module.exports = router;
