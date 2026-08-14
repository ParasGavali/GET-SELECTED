const router = require('express').Router();
const { listCompanies, companyDetail } = require('../controllers/companyController');

router.get('/companies', listCompanies);
router.get('/companies/:slug', companyDetail);

module.exports = router;
