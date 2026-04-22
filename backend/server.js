import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import verifyRoutes from './routes/verify.js';
import postsRoutes from './routes/posts.js';
import usersRoutes from './routes/users.js';
import { startCfSyncJob } from './jobs/syncCfRatings.js';
import editorialRoutes from './routes/editorials.js';
import commentRoutes from './routes/comments.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startCfSyncJob();   // Schedule daily CF rating sync
  })
  .catch(err => console.error('Failed to connect to MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api', verifyRoutes);
app.use('/api', postsRoutes);
app.use('/api', usersRoutes);
app.use('/api', editorialRoutes);
app.use('/api', commentRoutes);

// --- SERVING FRONTEND FOR PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
  // Use relative path to frontend/dist (from backend/)
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    // Exclude API routes from catch-all if they aren't matched above
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ message: 'API Route Not Found' });
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('RankUp API is running (Development Mode)');
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
