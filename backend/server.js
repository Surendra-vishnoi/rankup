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
  
  // Express 5.x modern catch-all: Use middleware instead of `app.get('*')`
  // since path-to-regexp v8 no longer supports unnamed wildcards.
  app.use((req, res, next) => {
    // Exclude API routes from catch-all (they should 404 natively if unmatched)
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API Route Not Found' });
    }
    
    // Serve the React app
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        // If file is missing, it means frontend didn't build correctly.
        console.error('Failed to serve index.html:', err);
        res.status(404).send('Frontend build not found. The React app is not being served.');
      }
    });
  });
} else {
  app.get('/', (req, res) => {
    res.send('RankUp API is running (Development Mode)');
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
