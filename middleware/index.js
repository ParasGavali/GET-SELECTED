const User = require('../models/User');

function flash(req, type, message) {
  req.session.flash = req.session.flash || [];
  req.session.flash.push({ type, message });
}

function flashMiddleware(req, res, next) {
  req.flash = (type, message) => flash(req, type, message);
  res.locals.flashMessages = req.session.flash || [];
  delete req.session.flash;
  next();
}

async function trackActivity(req, res, next) {
  if (req.session && req.session.userId && req.method === 'GET') {
    try {
      const user = await User.findById(req.session.userId).select('lastActiveAt streak');
      if (user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
        const updates = { lastActiveAt: new Date() };
        if (last) {
          const lastDay = new Date(last);
          lastDay.setHours(0, 0, 0, 0);
          const diff = Math.round((today - lastDay) / (24 * 60 * 60 * 1000));
          if (diff >= 2) updates.streak = 1;
          else if (diff === 1) updates.streak = (user.streak || 0) + 1;
        } else {
          updates.streak = 1;
        }
        await User.updateOne({ _id: user._id }, updates).catch(() => {});
      }
    } catch (e) {
      /* ignore */
    }
  }
  next();
}

async function loadUser(req, res, next) {
  res.locals.currentPath = req.path;
  if (req.session && req.session.userId) {
    const user = await User.findById(req.session.userId).catch(() => null);
    req.user = user;
    res.locals.user = user;
  }
  next();
}

module.exports = { flashMiddleware, trackActivity, loadUser };
