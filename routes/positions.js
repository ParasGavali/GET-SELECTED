const router = require('express').Router();
const { listPositions, positionDetail, positionMockTest } = require('../controllers/positionController');
const { requireAuth } = require('../middleware/auth');

router.get('/positions', listPositions);
router.get('/positions/:slug', positionDetail);
router.post('/positions/:slug/mock', requireAuth, positionMockTest);

module.exports = router;
