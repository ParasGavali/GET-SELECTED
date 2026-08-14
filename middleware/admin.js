function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    if (req.session && req.session.userId) {
      req.flash('error', 'You do not have permission to view that page.');
      return res.redirect('/dashboard');
    }
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

module.exports = { requireAdmin };
