const router = require('express').Router();
const { toggleBookmark, savedPage } = require('../controllers/bookmarkController');
const { requireAuth } = require('../middleware/auth');

router.get('/saved', requireAuth, savedPage);
router.post('/api/bookmark/toggle', requireAuth, toggleBookmark);

module.exports = router;
