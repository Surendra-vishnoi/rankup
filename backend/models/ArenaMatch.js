import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, default: '' },
  language: { type: String, default: 'cpp' },
  verdict: { type: String, default: 'pending' }, // 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'pending'
  submittedAt: { type: Date, default: Date.now },
  judge0Token: { type: String, default: '' },
  stdout: { type: String, default: '' },
  stderr: { type: String, default: '' },
  time: { type: String, default: '' },       // execution time
  memory: { type: Number, default: 0 },
}, { _id: true });

const arenaMatchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: {
    contestId:  { type: Number },
    index:      { type: String },       // e.g. 'A', 'B', '1C'
    name:       { type: String },
    rating:     { type: Number },
    tags:       [String],
    link:       { type: String },
  },
  timerMinutes: { type: Number, default: 30 },   // configurable match duration
  startTime:    { type: Date },
  endTime:      { type: Date },
  status: {
    type: String,
    enum: ['waiting', 'live', 'finished'],
    default: 'waiting',
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isDraw: { type: Boolean, default: false },

  // Elo snapshots (before the match)
  user1EloSnapshot: { type: Number, default: 1000 },
  user2EloSnapshot: { type: Number, default: 1000 },
  user1EloDelta:    { type: Number, default: 0 },
  user2EloDelta:    { type: Number, default: 0 },

  submissions: [submissionSchema],
}, { timestamps: true });

const ArenaMatch = mongoose.model('ArenaMatch', arenaMatchSchema);
export default ArenaMatch;
