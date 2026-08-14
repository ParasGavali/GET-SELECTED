const User = require('../models/User');

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  const user = await User.findById(req.session.userId);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    req.flash('error', 'Your session has expired. Please log in again.');
    return res.redirect('/login');
  }
  req.user = user;
  res.locals.user = user;
  next();
}

async function requireGuest(req, res, next) {
  if (req.session && req.session.userId) return res.redirect('/dashboard');
  next();
}

module.exports = { requireAuth, requireGuest };
