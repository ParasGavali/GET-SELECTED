const router = require('express').Router();
const { leaderboard } = require('../controllers/analyticsController');

router.get('/leaderboard', leaderboard);

module.exports = router;
