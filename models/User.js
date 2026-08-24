const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 8, maxlength: 200 },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    college: { type: String, trim: true, maxlength: 120, default: '' },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
    branch: { type: String, trim: true, maxlength: 80, default: '' },
    year: { type: Number, min: 1, max: 6, default: null },
    avatarColor: { type: String, default: '#4f46e5' },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: null },
    streak: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    college: this.college,
    collegeId: this.collegeId,
    branch: this.branch,
    year: this.year,
    avatarColor: this.avatarColor,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
