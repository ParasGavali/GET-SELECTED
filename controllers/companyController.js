const Company = require('../models/Company');
const Test = require('../models/Test');
const Question = require('../models/Question');
const CodingProblem = require('../models/CodingProblem');

async function listCompanies(req, res, next) {
  try {
    const companies = await Company.find({ isActive: true }).sort('order').lean();
    const counts = await Promise.all(
      companies.map(async (c) => ({
        company: c._id,
        tests: await Test.countDocuments({ company: c._id, isPublished: true }),
        questions: await Question.countDocuments({ companies: c._id, isActive: true }),
      }))
    );
    const countMap = new Map(counts.map((c) => [String(c.company), c]));
    res.render('student/companies-list', { title: 'Company Preparation - GET SELECTED', companies, countMap });
  } catch (err) {
    next(err);
  }
}

async function companyDetail(req, res, next) {
  try {
    const company = await Company.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!company) return res.status(404).render('errors/404', { title: 'Company not found' });

    const [tests, coding, questions] = await Promise.all([
      Test.find({ company: company._id, isPublished: true }).sort('type createdAt').lean(),
      CodingProblem.find({ companies: company._id, isActive: true }).lean(),
      Question.countDocuments({ companies: company._id, isActive: true }),
    ]);

    // Build preparation categories from focus areas + linked subjects
    const focusAreas = company.focusAreas && company.focusAreas.length ? company.focusAreas : ['Aptitude', 'Reasoning', 'Verbal', 'Technical', 'Coding'];

    res.render('student/company-detail', {
      title: `${company.name} Preparation - GET SELECTED`,
      company,
      tests,
      coding,
      focusAreas,
      questions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCompanies, companyDetail };
