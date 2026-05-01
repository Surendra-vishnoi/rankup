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
    required: true,
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
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
