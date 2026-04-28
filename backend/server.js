import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
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
import Message from './models/Message.js';
import User from './models/User.js';

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

app.use(express.json());
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

// ─── Socket.IO Real-time Chat ───────────────────────────────────────────────
// Parse cookie from socket handshake and authenticate user
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

io.on('connection', (socket) => {
  // Each user joins their own private room
  socket.join(`user:${socket.userId}`);
  console.log(`[Chat] ${socket.username} connected (${socket.id})`);

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

      // Emit to recipient's room and sender's room (both see the message instantly)
      io.to(`user:${recipient._id}`).emit('receive_message', payload);
      io.to(`user:${socket.userId}`).emit('receive_message', payload);
    } catch (err) {
      console.error('[Chat] send_message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Chat] ${socket.username} disconnected`);
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
