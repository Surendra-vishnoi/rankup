import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    // not required to support google login without password
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  cfHandle: {
    type: String,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isWingMember: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isCoordinator: {
    type: Boolean,
    default: false,
  },
  customTitle: {
    type: String,
    default: '',
    trim: true,
  },
  rating: {
    type: Number,
  },
  rank: {
    type: String,
  },
  karma: {
    type: Number,
    default: 0,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  arenaElo: {
    type: Number,
    default: 1000,
  },
  arenaWins: { type: Number, default: 0 },
  arenaLosses: { type: Number, default: 0 },
  arenaDraws: { type: Number, default: 0 },

  // Streak system
  streakCount: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastStreakDate: { type: Date, default: null },

  // Platform stats
  contestsParticipated: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: null },
  activeDates: [{ type: String }], // 'YYYY-MM-DD'

  // Bio & Social
  bio: { type: String, default: '', trim: true },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    codeforces: { type: String, default: '' },
    codechef: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    other: { type: String, default: '' }
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
