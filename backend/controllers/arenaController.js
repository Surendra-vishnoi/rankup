import ArenaMatch from '../models/ArenaMatch.js';
import User from '../models/User.js';

/**
 * GET /api/arena/leaderboard
 * Returns top 50 users sorted by arenaElo descending.
 */
export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ arenaElo: { $exists: true } })
      .select('username arenaElo arenaWins arenaLosses arenaDraws rating rank cfHandle')
      .sort({ arenaElo: -1 })
      .limit(50);
    res.json({ users });
  } catch (err) {
    console.error('[Arena] getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/arena/history/:username
 * Returns past matches for a user (up to 20, newest first).
 */
export const getMatchHistory = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('_id');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const matches = await ArenaMatch.find({
      $or: [{ user1: user._id }, { user2: user._id }],
      status: 'finished',
    })
      .populate('user1', 'username arenaElo rating rank')
      .populate('user2', 'username arenaElo rating rank')
      .populate('winner', 'username')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json({ matches });
  } catch (err) {
    console.error('[Arena] getMatchHistory error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/arena/match/:matchId
 * Returns details of a single match.
 */
export const getMatch = async (req, res) => {
  try {
    const match = await ArenaMatch.findOne({ matchId: req.params.matchId })
      .populate('user1', 'username arenaElo rating rank cfHandle')
      .populate('user2', 'username arenaElo rating rank cfHandle')
      .populate('winner', 'username');
    if (!match) return res.status(404).json({ message: 'Match not found.' });
    res.json({ match });
  } catch (err) {
    console.error('[Arena] getMatch error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * POST /api/arena/execute
 * Proxies code execution to Judge0 API.
 * Body: { source_code, language_id, stdin }
 */
export const executeCode = async (req, res) => {
  const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
  const JUDGE0_KEY  = process.env.JUDGE0_RAPIDAPI_KEY || 'PLACEHOLDER_ADD_YOUR_RAPIDAPI_KEY';

  const { source_code, language_id, stdin } = req.body;
  if (!source_code || !language_id) {
    return res.status(400).json({ message: 'source_code and language_id are required.' });
  }

  if (JUDGE0_KEY === 'PLACEHOLDER_ADD_YOUR_RAPIDAPI_KEY') {
    // Return a mock response so the UI works without a real key
    return res.json({
      mock: true,
      stdout: '[Mock Run] Code received. Add JUDGE0_RAPIDAPI_KEY to backend .env to enable real execution.\n',
      stderr: '',
      status: { id: 3, description: 'Accepted' },
      time: '0.001',
      memory: 1024,
    });
  }

  try {
    // Step 1: Submit to Judge0
    const submitRes = await fetch(`https://${JUDGE0_HOST}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Host': JUDGE0_HOST,
        'X-RapidAPI-Key': JUDGE0_KEY,
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin: stdin || '',
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error('[Judge0] Submit error:', errText);
      return res.status(502).json({ message: 'Code execution service error.', detail: errText });
    }

    const result = await submitRes.json();
    res.json(result);
  } catch (err) {
    console.error('[Arena] executeCode error:', err);
    res.status(500).json({ message: 'Failed to execute code.' });
  }
};
