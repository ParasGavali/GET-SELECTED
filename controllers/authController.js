const User = require('../models/User');

function renderAuth(req, res, view, extra = {}) {
  res.render(view, { title: extra.title || 'Authentication', next: req.query.next || '/dashboard', ...extra });
}

const signupPage = (req, res) => renderAuth(req, res, 'auth/signup', { title: 'Create your account' });
const loginPage = (req, res) => renderAuth(req, res, 'auth/login', { title: 'Log in to GET SELECTED' });

async function signup(req, res, next) {
  try {
    const { name, email, password, confirmPassword, college = '', branch = '', year = '' } = req.body;

    if (!name || !name.trim()) return renderAuth(req, res, 'auth/signup', { title: 'Create your account', error: 'Please enter your name.', values: req.body });
    if (!/^\S+@\S+\.\S+$/.test(email || '')) return renderAuth(req, res, 'auth/signup', { title: 'Create your account', error: 'Please enter a valid email address.', values: req.body });
    if (!password || password.length < 8) return renderAuth(req, res, 'auth/signup', { title: 'Create your account', error: 'Password must be at least 8 characters long.', values: req.body });
    if (password !== confirmPassword) return renderAuth(req, res, 'auth/signup', { title: 'Create your account', error: 'Passwords do not match.', values: req.body });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return renderAuth(req, res, 'auth/signup', { title: 'Create your account', error: 'An account with this email already exists. Try logging in.', values: req.body });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college.trim(),
      branch: branch.trim(),
      year: year ? Number(year) : null,
    });

    req.session.userId = user._id;
    req.flash('success', `Welcome to GET SELECTED, ${user.name.split(' ')[0]}! Start preparing for placements today.`);
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password || ''))) {
      return renderAuth(req, res, 'auth/login', { title: 'Log in to GET SELECTED', error: 'Invalid email or password.', values: { email } });
    }
    if (!user.isActive) return renderAuth(req, res, 'auth/login', { title: 'Log in to GET SELECTED', error: 'This account has been deactivated. Please contact support.' });

    req.session.userId = user._id;
    req.session.role = user.role;
    const next = req.body.next && req.body.next.startsWith('/') ? req.body.next : '/dashboard';
    req.flash('success', `Welcome back, ${user.name.split(' ')[0]}!`);
    res.redirect(next);
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('getselected.sid');
    res.redirect('/');
  });
}

module.exports = { signupPage, loginPage, signup, login, logout };
