import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth.js';
import verifyRoutes from './routes/verify.js';
import postsRoutes from './routes/posts.js';
import usersRoutes from './routes/users.js';
import { startCfSyncJob } from './jobs/syncCfRatings.js';
import editorialRoutes from './routes/editorials.js';
import commentRoutes from './routes/comments.js';
import contestRoutes from './routes/contests.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import arenaRoutes from './routes/arena.js';
import aiEditorialRoutes from './routes/aiEditorials.js';
import Message from './models/Message.js';
import User from './models/User.js';
import ArenaMatch from './models/ArenaMatch.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [CLIENT_URL, 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:5175'];

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startCfSyncJob();
  })
  .catch(err => console.error('Failed to connect to MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api', verifyRoutes);
app.use('/api', postsRoutes);
app.use('/api', usersRoutes);
app.use('/api', editorialRoutes);
app.use('/api', commentRoutes);
app.use('/api', contestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', arenaRoutes);
app.use('/api/ai-editorials', aiEditorialRoutes);

// ─── Socket.IO Auth Middleware ────────────────────────────────────────────────
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    if (!tokenMatch) return next(new Error('Authentication required'));
    const decoded = jwt.verify(tokenMatch[1], process.env.JWT_SECRET || 'fallback_secret');
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// ─── Codeforces Problem Cache ─────────────────────────────────────────────────
let cfProblemCache = null;
let cfCacheExpiry = 0;

async function fetchCFProblems() {
  if (cfProblemCache && Date.now() < cfCacheExpiry) return cfProblemCache;
  try {
    const res = await fetch('https://codeforces.com/api/problemset.problems?tags=');
    if (!res.ok) throw new Error('CF API failed');
    const data = await res.json();
    if (data.status === 'OK') {
      cfProblemCache = data.result.problems;
      cfCacheExpiry = Date.now() + 60 * 60 * 1000; // 1hr cache
      console.log(`[Arena] CF problem cache refreshed: ${cfProblemCache.length} problems`);
    }
  } catch (err) {
    console.error('[Arena] Failed to fetch CF problems:', err.message);
    if (!cfProblemCache) cfProblemCache = [];
  }
  return cfProblemCache || [];
}

async function fetchCFProblemDetails(contestId, index) {
  try {
    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.5 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(res.data);
    const problemStatement = $('.problem-statement');
    if (!problemStatement.length) return null;

    const descriptionHtml = problemStatement.find('.header').next('div').html() || '';
    const inputSpecHtml = problemStatement.find('.input-specification').html() || '';
    const outputSpecHtml = problemStatement.find('.output-specification').html() || '';
    const noteHtml = problemStatement.find('.note').html() || '';

    const inputs = [];
    const outputs = [];
    
    problemStatement.find('.sample-test .input pre').each((i, el) => {
      let text = '';
      const lines = $(el).find('.test-case-line');
      if (lines.length) {
        text = lines.map((_, line) => $(line).text()).get().join('\n');
      } else {
        let html = $(el).html() || '';
        text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      }
      inputs.push(text.trim());
    });
    
    problemStatement.find('.sample-test .output pre').each((i, el) => {
      let text = '';
      const lines = $(el).find('.test-case-line');
      if (lines.length) {
        text = lines.map((_, line) => $(line).text()).get().join('\n');
      } else {
        let html = $(el).html() || '';
        text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      }
      outputs.push(text.trim());
    });

    const sampleTests = [];
    for (let i = 0; i < inputs.length; i++) {
      sampleTests.push({
        input: inputs[i] || '',
        output: outputs[i] || ''
      });
    }

    return {
      descriptionHtml,
      inputSpecHtml,
      outputSpecHtml,
      noteHtml,
      sampleTests
    };
  } catch (err) {
    console.error('[CF Scraper] Failed to scrape problem details:', err.message);
    return null;
  }
}

/**
 * Fetch a CF problem that neither user has solved.
 * Difficulty target = minimum CF rating of both users (±200 buffer).
 */
async function selectProblem(user1Rating, user2Rating) {
  const targetRating = Math.min(user1Rating || 1200, user2Rating || 1200);
  const minRating = Math.max(800, targetRating - 200);
  const maxRating = targetRating + 200;

  const allProblems = await fetchCFProblems();
  const candidates = allProblems.filter(p =>
    p.rating && p.rating >= minRating && p.rating <= maxRating && p.contestId
  );

  if (!candidates.length) {
    const details = await fetchCFProblemDetails(1, 'A');
    return {
      contestId: 1,
      index: 'A',
      name: 'Theatre Square',
      rating: 1000,
      tags: ['math'],
      link: 'https://codeforces.com/problemset/problem/1/A',
      descriptionHtml: details?.descriptionHtml || '',
      inputSpecHtml: details?.inputSpecHtml || '',
      outputSpecHtml: details?.outputSpecHtml || '',
      noteHtml: details?.noteHtml || '',
      sampleTests: details?.sampleTests || []
    };
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const details = await fetchCFProblemDetails(pick.contestId, pick.index);

  return {
    contestId: pick.contestId,
    index: pick.index,
    name: pick.name,
    rating: pick.rating,
    tags: pick.tags || [],
    link: `https://codeforces.com/problemset/problem/${pick.contestId}/${pick.index}`,
    descriptionHtml: details?.descriptionHtml || '',
    inputSpecHtml: details?.inputSpecHtml || '',
    outputSpecHtml: details?.outputSpecHtml || '',
    noteHtml: details?.noteHtml || '',
    sampleTests: details?.sampleTests || []
  };
}

// ─── Elo Calculation ──────────────────────────────────────────────────────────
const ELO_K = 32;
function calcElo(ratingA, ratingB, outcome) {
  // outcome: 1 = A wins, 0 = A loses, 0.5 = draw
  const expected = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const delta = Math.round(ELO_K * (outcome - expected));
  return delta;
}

// ─── Arena Matchmaking Queue ──────────────────────────────────────────────────
// Map<userId, { socket, username, cfRating, arenaElo, timerMinutes }>
const arenaQueue = new Map();
// Map<matchId, { user1SocketId, user2SocketId, timerHandle, endTime }>
const activeMatches = new Map();

function generateMatchId() {
  return `arena_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function tryMatchUsers(newSocket, timerMinutes) {
  const newUser = arenaQueue.get(newSocket.userId);
  if (!newUser) return;

  for (const [otherUserId, otherUser] of arenaQueue.entries()) {
    if (otherUserId === newSocket.userId) continue;

    // Match by Elo proximity (±200 range, configurable)
    const eloDiff = Math.abs(newUser.arenaElo - otherUser.arenaElo);
    if (eloDiff > 200) continue;

    // Found a match!
    arenaQueue.delete(newSocket.userId);
    arenaQueue.delete(otherUserId);

    const matchId = generateMatchId();
    const problem = await selectProblem(newUser.cfRating, otherUser.cfRating);

    // Save match to DB
    const match = await ArenaMatch.create({
      matchId,
      user1: newSocket.userId,
      user2: otherUserId,
      problem,
      timerMinutes: timerMinutes || 30,
      startTime: new Date(),
      endTime: new Date(Date.now() + (timerMinutes || 30) * 60 * 1000),
      status: 'live',
      user1EloSnapshot: newUser.arenaElo,
      user2EloSnapshot: otherUser.arenaElo,
    });

    // Emit to both players
    const matchPayload = {
      matchId,
      problem,
      timerMinutes: timerMinutes || 30,
      endTime: match.endTime.toISOString(),
      opponent: {
        username: otherUser.username,
        arenaElo: otherUser.arenaElo,
        cfRating: otherUser.cfRating,
      },
    };

    const myPayload = {
      ...matchPayload,
      opponent: {
        username: newUser.username,
        arenaElo: newUser.arenaElo,
        cfRating: newUser.cfRating,
      },
    };

    io.to(`user:${newSocket.userId}`).emit('arena:match_found', matchPayload);
    io.to(`user:${otherUserId}`).emit('arena:match_found', myPayload);

    // Auto-expire after timer
    const timerHandle = setTimeout(() => expireMatch(matchId), (timerMinutes || 30) * 60 * 1000);
    activeMatches.set(matchId, {
      user1Id: newSocket.userId,
      user2Id: otherUserId,
      timerHandle,
    });

    console.log(`[Arena] Match created: ${matchId} | ${newUser.username} vs ${otherUser.username}`);
    return;
  }
}

async function expireMatch(matchId) {
  const meta = activeMatches.get(matchId);
  if (!meta) return;
  clearTimeout(meta.timerHandle);
  activeMatches.delete(matchId);

  const match = await ArenaMatch.findOne({ matchId });
  if (!match || match.status === 'finished') return;

  match.status = 'finished';
  match.isDraw = true;
  await match.save();

  // Update Elo for draw
  const [u1, u2] = await Promise.all([
    User.findById(match.user1),
    User.findById(match.user2),
  ]);
  if (u1 && u2) {
    const delta1 = calcElo(u1.arenaElo, u2.arenaElo, 0.5);
    const delta2 = calcElo(u2.arenaElo, u1.arenaElo, 0.5);
    await User.findByIdAndUpdate(u1._id, { $inc: { arenaElo: delta1, arenaDraws: 1 } });
    await User.findByIdAndUpdate(u2._id, { $inc: { arenaElo: delta2, arenaDraws: 1 } });
    await ArenaMatch.findOneAndUpdate({ matchId }, {
      user1EloDelta: delta1,
      user2EloDelta: delta2,
    });

    const resultPayload = {
      matchId,
      isDraw: true,
      winner: null,
      user1: { username: u1.username, eloDelta: delta1, newElo: u1.arenaElo + delta1 },
      user2: { username: u2.username, eloDelta: delta2, newElo: u2.arenaElo + delta2 },
    };
    io.to(`user:${match.user1}`).emit('arena:result', resultPayload);
    io.to(`user:${match.user2}`).emit('arena:result', resultPayload);
    console.log(`[Arena] Match expired (draw): ${matchId}`);
  }
}

async function finishMatch(matchId, winnerId, loserId) {
  const meta = activeMatches.get(matchId);
  if (meta) {
    clearTimeout(meta.timerHandle);
    activeMatches.delete(matchId);
  }

  const match = await ArenaMatch.findOne({ matchId });
  if (!match || match.status === 'finished') return;

  match.status = 'finished';
  match.winner = winnerId;
  await match.save();

  const [winner, loser] = await Promise.all([
    User.findById(winnerId),
    User.findById(loserId),
  ]);
  if (!winner || !loser) return;

  const winnerDelta = calcElo(winner.arenaElo, loser.arenaElo, 1);
  const loserDelta  = calcElo(loser.arenaElo, winner.arenaElo, 0);

  await User.findByIdAndUpdate(winner._id, { $inc: { arenaElo: winnerDelta, arenaWins: 1 } });
  await User.findByIdAndUpdate(loser._id,  { $inc: { arenaElo: loserDelta,  arenaLosses: 1 } });
  await ArenaMatch.findOneAndUpdate(
    { matchId },
    winnerId.toString() === match.user1.toString()
      ? { user1EloDelta: winnerDelta, user2EloDelta: loserDelta }
      : { user1EloDelta: loserDelta, user2EloDelta: winnerDelta }
  );

  const resultPayload = {
    matchId,
    isDraw: false,
    winner: { username: winner.username, _id: winner._id },
    user1: { username: '', eloDelta: 0, newElo: 0 },
    user2: { username: '', eloDelta: 0, newElo: 0 },
  };

  if (match.user1.toString() === winnerId.toString()) {
    resultPayload.user1 = { username: winner.username, eloDelta: winnerDelta, newElo: winner.arenaElo + winnerDelta };
    resultPayload.user2 = { username: loser.username,  eloDelta: loserDelta,  newElo: loser.arenaElo + loserDelta };
  } else {
    resultPayload.user1 = { username: loser.username,  eloDelta: loserDelta,  newElo: loser.arenaElo + loserDelta };
    resultPayload.user2 = { username: winner.username, eloDelta: winnerDelta, newElo: winner.arenaElo + winnerDelta };
  }

  io.to(`user:${match.user1}`).emit('arena:result', resultPayload);
  io.to(`user:${match.user2}`).emit('arena:result', resultPayload);
  console.log(`[Arena] Match finished: ${matchId} | Winner: ${winner.username}`);
}

// ─── Judge0 submission helper ─────────────────────────────────────────────────
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '7f955470-b1aa-11ed-a590-7164eb066d76';

const JUDGE0_LANG_IDS = {
  cpp:        54,   // C++17
  c:          50,   // C (GCC)
  python:     71,   // Python 3
  java:       62,   // Java
  javascript: 63,   // Node.js
};

async function judgeCode(sourceCode, language, stdin = '') {
  const langId = JUDGE0_LANG_IDS[language] || 54;
  try {
    const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': JUDGE0_KEY,
      },
      body: JSON.stringify({ source_code: sourceCode, language_id: langId, stdin }),
    });
    return await res.json();
  } catch (err) {
    console.error('[Judge0] Error:', err.message);
    return { status: { id: 13, description: 'Internal Error' }, stdout: '', stderr: err.message };
  }
}

// ─── Codeforces submission helper ─────────────────────────────────────────────
async function checkCFSubmission(cfHandle, contestId, index, matchStartTime) {
  try {
    const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(cfHandle)}&from=1&count=10`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Codeforces API returned status ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch status from Codeforces');
    }

    const submissions = data.result;
    const matchStartSeconds = Math.floor(matchStartTime.getTime() / 1000) - 30; // 30-sec buffer

    const relevantSubmissions = submissions.filter(sub => 
      sub.problem.contestId === contestId &&
      sub.problem.index === index &&
      sub.creationTimeSeconds >= matchStartSeconds
    );

    if (relevantSubmissions.length === 0) {
      return { found: false };
    }

    const latest = relevantSubmissions[0];
    return {
      found: true,
      verdict: latest.verdict,
      timeConsumedMillis: latest.timeConsumedMillis,
      memoryConsumedBytes: latest.memoryConsumedBytes,
      id: latest.id
    };
  } catch (err) {
    console.error('[Arena CF Check] Error:', err.message);
    throw err;
  }
}

function mapCFVerdict(verdict) {
  if (!verdict) return 'Testing...';
  switch (verdict) {
    case 'OK': return 'AC';
    case 'WRONG_ANSWER': return 'Wrong Answer';
    case 'TIME_LIMIT_EXCEEDED': return 'Time Limit Exceeded';
    case 'MEMORY_LIMIT_EXCEEDED': return 'Memory Limit Exceeded';
    case 'RUNTIME_ERROR': return 'Runtime Error';
    case 'COMPILATION_ERROR': return 'Compilation Error';
    case 'CHALLENGED': return 'Challenged / Hacked';
    case 'SKIPPED': return 'Skipped';
    case 'TESTING': return 'Testing...';
    default: return verdict;
  }
}

// ─── Socket.IO Events ─────────────────────────────────────────────────────────
io.on('connection', async (socket) => {
  // Each user joins their own private room
  socket.join(`user:${socket.userId}`);
  console.log(`[Socket] ${socket.username} connected (${socket.id})`);

  // ── DM Chat ────────────────────────────────────────────────────────────────
  socket.on('send_message', async ({ recipientUsername, content }) => {
    try {
      if (!content?.trim() || !recipientUsername) return;
      const recipient = await User.findOne({ username: recipientUsername }).select('_id');
      if (!recipient) return;
      const message = await Message.create({
        sender: socket.userId,
        recipient: recipient._id,
        content: content.trim().slice(0, 2000),
      });
      const populated = await message.populate([
        { path: 'sender', select: 'username avatarUrl' },
        { path: 'recipient', select: 'username avatarUrl' },
      ]);
      const payload = populated.toObject();
      io.to(`user:${recipient._id}`).emit('receive_message', payload);
      io.to(`user:${socket.userId}`).emit('receive_message', payload);
    } catch (err) {
      console.error('[Chat] send_message error:', err);
    }
  });

  // ── Arena: Join Queue ──────────────────────────────────────────────────────
  socket.on('arena:join_queue', async ({ timerMinutes = 30 } = {}) => {
    try {
      if (arenaQueue.has(socket.userId)) return; // already queued

      const user = await User.findById(socket.userId).select('username arenaElo rating isVerified cfHandle');
      if (!user) return;

      if (!user.isVerified || !user.cfHandle) {
        socket.emit('arena:queued_error', { message: 'You must verify your Codeforces handle to join the CodeArena!' });
        return;
      }

      arenaQueue.set(socket.userId, {
        socket,
        username: user.username,
        arenaElo: user.arenaElo || 1000,
        cfRating: user.rating || 1200,
        timerMinutes,
      });

      socket.emit('arena:queued', { message: 'You are in the queue. Looking for an opponent...' });
      console.log(`[Arena] ${user.username} joined queue (Elo: ${user.arenaElo})`);

      await tryMatchUsers(socket, timerMinutes);
    } catch (err) {
      console.error('[Arena] join_queue error:', err);
    }
  });

  // ── Arena: Leave Queue ─────────────────────────────────────────────────────
  socket.on('arena:leave_queue', () => {
    arenaQueue.delete(socket.userId);
    socket.emit('arena:queue_left', {});
    console.log(`[Arena] ${socket.username} left queue`);
  });

  // ── Arena: Submit Code ─────────────────────────────────────────────────────
  socket.on('arena:submit', async ({ matchId, code, language }) => {
    try {
      const match = await ArenaMatch.findOne({ matchId });
      if (!match || match.status !== 'live') {
        return socket.emit('arena:submit_result', { error: 'Match not active.' });
      }

      // Verify this user is in the match
      const isUser1 = match.user1.toString() === socket.userId;
      const isUser2 = match.user2.toString() === socket.userId;
      if (!isUser1 && !isUser2) return;

      socket.emit('arena:submit_result', { status: 'judging', message: 'Checking Codeforces submissions...' });

      // Fetch user's CF handle
      const user = await User.findById(socket.userId).select('cfHandle isVerified');
      if (!user || !user.isVerified || !user.cfHandle) {
        return socket.emit('arena:submit_result', { error: 'Please verify your Codeforces handle first!' });
      }

      const cfResult = await checkCFSubmission(user.cfHandle, match.problem.contestId, match.problem.index, match.startTime);
      if (!cfResult.found) {
        return socket.emit('arena:submit_result', { 
          error: `No recent Codeforces submission found for problem ${match.problem.contestId}${match.problem.index}. Please submit your code directly on Codeforces first, then try again!` 
        });
      }

      const verdict = cfResult.verdict;
      const isAC = verdict === 'OK';

      // Save submission
      match.submissions.push({
        user: socket.userId,
        code,
        language,
        verdict: isAC ? 'AC' : mapCFVerdict(verdict),
        submittedAt: new Date(),
        stdout: `Codeforces Submission ID: ${cfResult.id}\nVerdict: ${verdict}`,
        stderr: '',
        time: cfResult.timeConsumedMillis ? (cfResult.timeConsumedMillis / 1000).toString() : '0',
        memory: cfResult.memoryConsumedBytes || 0,
      });
      await match.save();

      socket.emit('arena:submit_result', {
        verdict: isAC ? 'AC' : mapCFVerdict(verdict),
        stdout: `Codeforces Submission ID: ${cfResult.id}\nVerdict: ${verdict}`,
        stderr: '',
        time: cfResult.timeConsumedMillis ? (cfResult.timeConsumedMillis / 1000).toString() : '0',
        memory: cfResult.memoryConsumedBytes || 0,
        isAC,
      });

      if (isAC) {
        const loserId = isUser1 ? match.user2 : match.user1;
        await finishMatch(matchId, socket.userId, loserId.toString());
      }
    } catch (err) {
      console.error('[Arena] submit error:', err);
      socket.emit('arena:submit_result', { error: 'Server error during submission verification.' });
    }
  });

  // ── Arena: Forfeit ─────────────────────────────────────────────────────────
  socket.on('arena:forfeit', async ({ matchId }) => {
    try {
      const match = await ArenaMatch.findOne({ matchId });
      if (!match || match.status !== 'live') return;
      const isUser1 = match.user1.toString() === socket.userId;
      if (!isUser1 && match.user2.toString() !== socket.userId) return;
      const loserId  = socket.userId;
      const winnerId = isUser1 ? match.user2.toString() : match.user1.toString();
      await finishMatch(matchId, winnerId, loserId);
    } catch (err) {
      console.error('[Arena] forfeit error:', err);
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    arenaQueue.delete(socket.userId);
    console.log(`[Socket] ${socket.username} disconnected`);
  });
});

// --- SERVING FRONTEND FOR PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API Route Not Found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        console.error('Failed to serve index.html:', err);
        res.status(404).send('Frontend build not found.');
      }
    });
  });
} else {
  app.get('/', (req, res) => {
    res.send('RankUp API is running (Development Mode)');
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
