const router = require('express').Router();
const { profile, updateProfile, changePassword } = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

router.get('/profile', requireAuth, profile);
router.post('/profile', requireAuth, updateProfile);
router.post('/profile/password', requireAuth, changePassword);

module.exports = router;
