const router = require('express').Router();
const { home, about, search } = require('../controllers/homeController');

router.get('/', home);
router.get('/about', about);
router.get('/search', search);

module.exports = router;
