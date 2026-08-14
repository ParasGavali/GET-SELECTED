const User = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const QuestionAttempt = require('../models/QuestionAttempt');
const CodeSubmission = require('../models/CodeSubmission');
const { getOverallRanking } = require('../services/rankingService');

async function profile(req, res, next) {
  try {
    const user = req.user;
    const [tests, questions, coding, ranking] = await Promise.all([
      TestAttempt.countDocuments({ user: user._id, status: { $in: ['submitted', 'auto_submitted', 'timed_out'] } }),
      QuestionAttempt.countDocuments({ user: user._id }),
      CodeSubmission.countDocuments({ user: user._id }),
      getOverallRanking(1000),
    ]);

    const myIndex = ranking.findIndex((r) => String(r.user) === String(user._id));
    const myRank = myIndex >= 0 ? myIndex + 1 : null;

    const correct = await QuestionAttempt.countDocuments({ user: user._id, correct: true });
    const accuracy = questions ? Math.round((correct / questions) * 100) : 0;

    res.render('student/profile', { title: 'My Profile - GET SELECTED', stats: { tests, questions, coding, accuracy, rank: myRank, streak: user.streak } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, college, branch, year } = req.body;
    if (!name || !name.trim()) {
      req.flash('error', 'Name is required.');
      return res.redirect('/profile');
    }
    await User.updateOne(
      { _id: req.user._id },
      { name: name.trim(), college: (college || '').trim(), branch: (branch || '').trim(), year: year ? Number(year) : null }
    );
    req.flash('success', 'Profile updated.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword || ''))) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/profile');
    }
    if (!newPassword || newPassword.length < 8) {
      req.flash('error', 'New password must be at least 8 characters long.');
      return res.redirect('/profile');
    }
    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/profile');
    }
    user.password = newPassword;
    await user.save();
    req.flash('success', 'Password changed successfully.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
}

module.exports = { profile, updateProfile, changePassword };
