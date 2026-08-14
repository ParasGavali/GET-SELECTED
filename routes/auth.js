const router = require('express').Router();
const { signupPage, loginPage, signup, login, logout } = require('../controllers/authController');
const { requireGuest } = require('../middleware/auth');

router.get('/signup', requireGuest, signupPage);
router.post('/signup', requireGuest, signup);
router.get('/login', requireGuest, loginPage);
router.post('/login', requireGuest, login);
router.post('/logout', logout);

module.exports = router;
