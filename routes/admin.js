const router = require('express').Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const admin = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.use(requireAuth, requireAdmin);

router.get('/', admin.adminDashboard);

// Questions
router.get('/questions', admin.adminQuestions);
router.get('/questions/new', admin.adminQuestionForm);
router.post('/questions', admin.adminQuestionCreate);
router.get('/questions/:id/edit', admin.adminQuestionForm);
router.post('/questions/:id', admin.adminQuestionUpdate);
router.post('/questions/:id/delete', admin.adminQuestionDelete);
router.post('/questions/:id/toggle', admin.adminQuestionToggle);

// Bulk import
router.get('/import', admin.adminImport);
router.post('/import/preview', upload.single('file'), admin.adminImportPreview);
router.post('/import/confirm', admin.adminImportConfirm);

// Tests
router.get('/tests', admin.adminTests);
router.get('/tests/new', admin.adminTestForm);
router.post('/tests', admin.adminTestCreate);
router.get('/tests/:id/edit', admin.adminTestForm);
router.post('/tests/:id', admin.adminTestUpdate);
router.post('/tests/:id/duplicate', admin.adminTestDuplicate);
router.post('/tests/:id/delete', admin.adminTestDelete);

// Companies
router.get('/companies', admin.adminCompanies);
router.get('/companies/new', admin.adminCompanyForm);
router.post('/companies', admin.adminCompanyCreate);
router.get('/companies/:id/edit', admin.adminCompanyForm);
router.post('/companies/:id', admin.adminCompanyUpdate);

// Users
router.get('/users', admin.adminUsers);
router.get('/users/:id', admin.adminUserDetail);
router.post('/users/:id/toggle', admin.adminUserToggle);

// Coding problems
router.get('/coding', admin.adminCoding);
router.get('/coding/new', admin.adminCodingForm);
router.post('/coding', admin.adminCodingCreate);
router.get('/coding/:id/edit', admin.adminCodingForm);
router.post('/coding/:id', admin.adminCodingUpdate);
router.post('/coding/:id/delete', admin.adminCodingDelete);

// Daily challenge
router.get('/daily', admin.adminDaily);
router.post('/daily', admin.adminDailyCreate);

module.exports = router;
